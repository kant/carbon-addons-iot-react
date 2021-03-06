import React from 'react';
import PropTypes from 'prop-types';
import isNil from 'lodash/isNil';
import merge from 'lodash/merge';
import { Button, PaginationV2, DataTable, Checkbox } from 'carbon-components-react';
import { iconFilter } from 'carbon-icons';

import { defaultFunction } from '../../utils/componentUtilityFunctions';

import FilterHeaderRow from './FilterHeaderRow/FilterHeaderRow';

const {
  Table: CarbonTable,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableContainer,
  TableToolbar,
  TableToolbarContent,
  TableToolbarAction,
  TableCell,
} = DataTable;

const propTypes = {
  /** Specify the properties of each column in the table */
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      size: PropTypes.number.isRequired,
      isSortable: PropTypes.bool,
      filter: PropTypes.shape({
        placeholderText: PropTypes.string,
        options: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string.isRequired,
            text: PropTypes.string.isRequired,
          })
        ),
      }),
    })
  ).isRequired,
  /** Data for the body of the table */
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      values: PropTypes.object,
    })
  ).isRequired,
  /** Optional properties to customize how the table should be rendered */
  options: PropTypes.shape({
    hasPagination: PropTypes.bool,
    hasRowSelection: PropTypes.bool,
    hasFilter: PropTypes.bool,
  }),
  /** Initial state of the table, should be updated via a local state wrapper component implementation or via a central store/redux */
  view: PropTypes.shape({
    pagination: PropTypes.shape({
      pageSize: PropTypes.number,
      pageSizes: PropTypes.arrayOf(PropTypes.number),
      page: PropTypes.number,
      totalItems: PropTypes.number.isRequired,
    }),
    filters: PropTypes.arrayOf(
      PropTypes.shape({
        columnId: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      })
    ),
    toolbar: PropTypes.shape({
      /** Specify which header row to display, will display default header row if null */
      activeBar: PropTypes.oneOf(['filter'], ['column']),
      /** Specify which batch actions to render in the batch action bar. If empty, no batch action toolbar will display */
      batchActions: PropTypes.arrayOf(
        PropTypes.shape({
          labelText: PropTypes.string.isRequired,
          icon: PropTypes.oneOfType([
            PropTypes.shape({
              width: PropTypes.string,
              height: PropTypes.string,
              viewBox: PropTypes.string.isRequired,
              svgData: PropTypes.object.isRequired,
            }),
            PropTypes.string,
          ]),
          iconDescription: PropTypes.string,
          onClick: PropTypes.func,
        })
      ),
    }),
    table: PropTypes.shape({
      isSelectAllSelected: PropTypes.bool,
      isSelectIndeterminate: PropTypes.bool,
      selectedIds: PropTypes.arrayOf(PropTypes.string),
      sort: PropTypes.shape({
        columnId: PropTypes.string,
        direction: PropTypes.oneOf(['NONE', 'ASC', 'DESC']),
      }),
    }),
  }),
  /** Callbacks for actions of the table, can be used to update state in wrapper component to update `view` props */
  actions: PropTypes.shape({
    pagination: PropTypes.shape({
      /** Specify a callback for when the current page or page size is changed. This callback is passed an object parameter containing the current page and the current page size */
      onChange: PropTypes.func,
    }),
    toolbar: PropTypes.shape({
      onApplyFilter: PropTypes.func,
      onToggleFilter: PropTypes.func,
      /** Specify a callback for when the user clicks toolbar button to clear all filters. Recieves a parameter of the current filter values for each column */
      onClearAllFilters: PropTypes.func,
    }),
    table: PropTypes.shape({
      onRowSelected: PropTypes.func,
      onSelectAll: PropTypes.func,
      onSortChange: PropTypes.func,
    }).isRequired,
  }),
};

const defaultProps = {
  options: { hasPagination: true, hasRowSelection: true, hasFilter: true },
  view: {
    pagination: {
      pageSize: 10,
      pageSizes: [10, 20, 30],
      page: 1,
    },
    toolbar: {},
    table: {
      isSelectAllSelected: false,
      selectedIds: [],
      sort: {},
    },
  },
  actions: {
    pagination: { onChange: defaultFunction },
    toolbar: {},
    table: {
      onSortChange: defaultFunction,
    },
  },
};

const Table = props => {
  const { columns, data, view, actions, options } = merge(defaultProps, props);

  const minItemInView = view.pagination ? (view.pagination.page - 1) * view.pagination.pageSize : 0;
  const maxItemInView = view.pagination
    ? view.pagination.page * view.pagination.pageSize
    : data.length;
  const visibleData = data.slice(minItemInView, maxItemInView);
  const filterBarActive = options.hasFilter && view.toolbar && view.toolbar.activeBar === 'filter';
  const filterBarActiveStyle = { paddingTop: 16 };
  return (
    <div>
      {/* <Toolbar
          {...view.toolbar}
          selectedItemCount={view.table.selectedIds.length}
          {...actions.toolbar}
          hasFilters={view.filters && !!view.filters.length}
        /> */}
      <TableContainer>
        <TableToolbar>
          <TableToolbarContent>
            {view.filters && !!view.filters.length ? ( // TODO: translate button
              <Button kind="secondary" onClick={actions.toolbar.onClearAllFilters} small>
                Clear All Filters
              </Button>
            ) : null}
            {options.hasFilter ? (
              <TableToolbarAction
                icon={iconFilter}
                iconDescription="Filter"
                onClick={actions.toolbar.onToggleFilter}
              />
            ) : null}
          </TableToolbarContent>
        </TableToolbar>

        <CarbonTable zebra={false}>
          <TableHead>
            <TableRow>
              {options.hasRowSelection ? (
                <TableHeader style={filterBarActive === true ? filterBarActiveStyle : {}}>
                  {/* TODO: Replace checkbox with TableSelectAll component when onChange bug is fixed
                    https://github.com/IBM/carbon-components-react/issues/1088 */}
                  <Checkbox
                    id="select-all"
                    labelText="Select All"
                    hideLabel
                    indeterminate={view.table.isSelectIndeterminate}
                    checked={view.table.isSelectAllSelected}
                    onChange={() => actions.table.onSelectAll(!view.table.isSelectAllSelected)}
                  />
                </TableHeader>
              ) : null}
              {columns.map(column => {
                const hasSort =
                  view.table && view.table.sort && view.table.sort.columnId === column.id;
                return (
                  <TableHeader
                    key={`column-${column.id}`}
                    style={filterBarActive === true ? filterBarActiveStyle : {}}
                    isSortable={column.isSortable}
                    isSortHeader={hasSort}
                    onClick={() => {
                      if (column.isSortable && actions.table.onChangeSort) {
                        actions.table.onChangeSort(column.id);
                      }
                    }}
                    sortDirection={hasSort ? view.table.sort.direction : 'NONE'}>
                    {column.name}
                  </TableHeader>
                );
              })}
            </TableRow>
            {filterBarActive && (
              <FilterHeaderRow
                columns={columns.map(column => ({
                  ...column.filter,
                  id: column.id,
                  isFilterable: !isNil(column.filter),
                }))}
                key={JSON.stringify(view.filters)}
                filters={view.filters}
                tableOptions={options}
                onApplyFilter={actions.toolbar.onApplyFilter}
              />
            )}
          </TableHead>
          <TableBody>
            {visibleData.map(i => (
              <TableRow key={i.id}>
                {options.hasRowSelection ? (
                  <TableCell>
                    {/* TODO: Replace checkbox with TableSelectRow component when onChange bug is fixed
                      https://github.com/IBM/carbon-components-react/issues/1088 */}
                    <Checkbox
                      id={`select-row-${i.id}`}
                      labelText="Select Row"
                      hideLabel
                      checked={view.table.selectedIds.includes(i.id)}
                      onChange={() =>
                        actions.table.onRowSelected(i.id, !view.table.selectedIds.includes(i.id))
                      }
                    />
                  </TableCell>
                ) : null}
                {columns.map(col => (
                  <TableCell key={col.id}>{i.values[col.id]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </CarbonTable>
      </TableContainer>

      {options.hasPagination ? <PaginationV2 {...view.pagination} {...actions.pagination} /> : null}
    </div>
  );
};

Table.propTypes = propTypes;
Table.defaultProps = defaultProps;

export default Table;
