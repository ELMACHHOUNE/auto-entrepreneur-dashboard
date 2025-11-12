import 'mantine-react-table/styles.css';
import {
  MantineReactTable,
  type MRT_ColumnDef,
  useMantineReactTable,
  type MRT_TableOptions,
  type MRT_Row,
  type MRT_Cell,
  type MRT_TableInstance,
} from 'mantine-react-table';
import type React from 'react';
import { useMemo, useState } from 'react';

// Generic reusable DataTable wrapper.
// Centralizes MantineReactTable configuration and styling so pages only pass data & columns.
export interface DataTableProps<T extends Record<string, unknown>> {
  columns: MRT_ColumnDef<T>[];
  data: T[];
  rowCount?: number;
  // React Query style pagination/filter state lifted up
  loading?: boolean;
  error?: boolean;
  enableRowActions?: boolean;
  manualPagination?: boolean;
  manualFiltering?: boolean;
  pagination?: { pageIndex: number; pageSize: number };
  onPaginationChange?: MRT_TableOptions<T>['onPaginationChange'];
  // Leave global filter unmanaged by default so built-in search works out of the box
  globalFilter?: string; // kept for backward compatibility (not used when undefined)
  onGlobalFilterChange?: (val: string) => void; // kept for backward compatibility (not used when undefined)
  renderRowActions?: (props: { row: MRT_Row<T> }) => React.ReactNode;
  renderTopToolbarCustomActions?: () => React.ReactNode;
  // Customize border color of the surrounding card/container
  // "border" uses the neutral border token; others use brand tokens
  borderTone?: 'border' | 'primary' | 'accent' | 'secondary' | 'success';
  // Optional: visually separate groups of rows (e.g., quarters) with an accent separator line
  groupByKey?: (rowOriginal: T) => string | number;
  groupSeparatorTone?: 'border' | 'primary' | 'accent' | 'secondary' | 'success';
  // Optional: enforce a specific order of groups (e.g., ['T1','T2','T3','T4'])
  groupOrder?: Array<string | number>;
  // Optional: sort comparator within each group (e.g., by invoice number ascending)
  groupWithinComparator?: (a: T, b: T) => number;
  // Optional: provide MRT initial sorting state (ids should match column accessors)
  defaultSorting?: Array<{ id: string; desc: boolean }>;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowCount,
  loading,
  error,
  enableRowActions,
  manualPagination,
  manualFiltering,
  pagination,
  onPaginationChange,
  globalFilter,
  onGlobalFilterChange,
  renderRowActions,
  renderTopToolbarCustomActions,
  borderTone = 'border',
  groupByKey,
  groupSeparatorTone = 'accent',
  groupOrder,
  groupWithinComparator,
  defaultSorting,
}: DataTableProps<T>) {
  // Memo columns to prevent re-renders
  const memoCols = useMemo(() => columns, [columns]);

  const borderVar = borderTone === 'border' ? 'var(--border)' : `var(--${borderTone})`;
  const groupSepVar =
    groupSeparatorTone === 'border' ? 'var(--border)' : `var(--${groupSeparatorTone})`;

  // Memoized style objects for stable references (avoid re-renders in Mantine components)
  const paginationStyles = useMemo(
    () => ({
      control: {
        background: 'var(--accent)',
        color: 'var(--accent-foreground)',
        borderColor: 'var(--accent)',
        transition: 'background-color 120ms ease',
        '&:hover': {
          background: 'color-mix(in oklch, var(--accent) 88%, black 12%)',
        },
        '&[data-active]': {
          background: 'var(--accent)',
          color: 'var(--accent-foreground)',
        },
        '&:disabled': {
          background: 'color-mix(in oklch, var(--accent) 40%, var(--muted) 60%)',
          color: 'var(--muted-foreground)',
        },
      },
      dots: { color: 'var(--accent)' },
    }),
    []
  );
  const searchInputStyles = useMemo(
    () => ({
      input: {
        background: 'var(--card)',
        color: 'var(--foreground)',
        borderColor: 'var(--input)',
      },
    }),
    []
  );

  // If grouping is requested, pre-sort the incoming data by the explicit group order,
  // and then by the provided in-group comparator. This ensures visual separators
  // appear in chronological quarter order while keeping rows sorted within each quarter.
  const sortedData = useMemo(() => {
    if (groupByKey && groupOrder && groupOrder.length > 0) {
      const orderMap = new Map<string, number>(groupOrder.map((k, i) => [String(k), i]));
      const arr = [...data];
      arr.sort((a, b) => {
        const ka = String(groupByKey(a));
        const kb = String(groupByKey(b));
        const ia = orderMap.get(ka) ?? Number.MAX_SAFE_INTEGER;
        const ib = orderMap.get(kb) ?? Number.MAX_SAFE_INTEGER;
        if (ia !== ib) return ia - ib;
        if (groupWithinComparator) return groupWithinComparator(a, b);
        return 0;
      });
      return arr;
    }
    return data;
  }, [data, groupByKey, groupOrder, groupWithinComparator]);

  // Internal pagination state when not controlled by parent
  const [internalPagination, setInternalPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const effectivePagination = pagination ?? internalPagination;

  const table = useMantineReactTable<T>({
    columns: memoCols,
    data: sortedData,
    rowCount,
    enableRowActions,
    enableGlobalFilter: true,
    manualFiltering: manualFiltering,
    manualPagination: manualPagination,
    state: {
      isLoading: loading,
      pagination: effectivePagination,
    },
    // If consumer provides controlled globalFilter handlers, use them; otherwise let MRT manage internally
    ...(globalFilter !== undefined && {
      state: {
        isLoading: loading,
        globalFilter,
        pagination: effectivePagination,
      },
      onGlobalFilterChange: (v: string | undefined) => onGlobalFilterChange?.(v ?? ''),
    }),
    initialState: {
      showGlobalFilter: true,
      ...(defaultSorting ? { sorting: defaultSorting } : {}),
    },
    onPaginationChange: (updater => {
      type PagState = { pageIndex: number; pageSize: number };
      const resolve = (u: PagState | ((prev: PagState) => PagState)): PagState =>
        typeof u === 'function'
          ? (u as (p: PagState) => PagState)(effectivePagination)
          : (u as PagState);

      if (manualPagination || pagination) {
        // Forward to parent using resolved state
        const resolved = resolve(updater as PagState | ((prev: PagState) => PagState));
        // Parent signature expects MRT_TableOptions<T>['onPaginationChange'] shape; cast minimally
        onPaginationChange?.(resolved as { pageIndex: number; pageSize: number });
      } else {
        const nextVal = resolve(updater as PagState | ((prev: PagState) => PagState));
        setInternalPagination({
          pageIndex: Number(nextVal.pageIndex) || 0,
          pageSize: Number(nextVal.pageSize) || internalPagination.pageSize,
        });
      }
    }) as (
      updater:
        | { pageIndex: number; pageSize: number }
        | ((prev: { pageIndex: number; pageSize: number }) => {
            pageIndex: number;
            pageSize: number;
          })
    ) => void,
    renderRowActions,
    renderTopToolbarCustomActions,
    mantineToolbarAlertBannerProps: error
      ? { color: 'red', children: 'Error loading data' }
      : undefined,
    // Global styling (token based) handled here instead of each page.
    mantinePaperProps: {
      shadow: 'sm',
      radius: 'md',
      withBorder: true,
      style: {
        background: 'var(--card)',
        borderColor: borderVar,
      },
    },
    mantineTableContainerProps: {
      style: {
        background: 'var(--card)',
        border: `1px solid ${borderVar}`,
        borderRadius: 'var(--radius)',
      },
    },
    mantineTableProps: {
      highlightOnHover: true,
      striped: true,
      style: { background: 'var(--card)' },
    },
    mantineTableHeadCellProps: {
      style: {
        background: 'var(--muted)',
        color: 'var(--foreground)',
        borderColor: 'var(--border)',
        fontWeight: 600,
        fontSize: '12px',
      },
    },
    mantineTableBodyCellProps: ({
      cell,
      table,
    }: {
      cell: MRT_Cell<T>;
      table: MRT_TableInstance<T>;
    }) => {
      // Default cell border color
      let style: React.CSSProperties = { borderColor: 'var(--border)' };
      if (groupByKey && table) {
        const idx: number = cell.row.index ?? 0;
        if (idx > 0) {
          const rows = table.getRowModel?.().rows ?? [];
          const prev = rows[idx - 1];
          const curr = rows[idx];
          const prevKey = prev?.original ? groupByKey(prev.original as T) : undefined;
          const currKey = curr?.original ? groupByKey(curr.original as T) : undefined;
          if (prevKey !== currKey) {
            // Add a thicker top border with the configured brand tone
            style = {
              ...style,
              borderTop: `2px solid ${groupSepVar}`,
            };
          }
        }
      }
      return { style };
    },
    mantineTableBodyRowProps: ({ row }) => ({
      style: {
        background:
          row.index % 2 === 0
            ? 'color-mix(in oklch, var(--card) 82%, var(--muted) 18%)'
            : 'var(--card)',
        transition: 'background-color 120ms ease',
      },
      onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
        const rowEl = e.currentTarget as HTMLTableRowElement;
        const hoverColor = 'color-mix(in oklch, var(--primary) 12%, var(--muted) 88%)';
        // Override MRT default hover (which uses --mrt-base-background-color)
        rowEl.style.setProperty('--mrt-base-background-color', hoverColor);
        rowEl.style.background = hoverColor;
        // Ensure cells match the row bg so no gray bleed in light mode
        rowEl.querySelectorAll('td').forEach(td => {
          (td as HTMLTableCellElement).style.background = hoverColor;
        });
      },
      onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
        const rowEl = e.currentTarget as HTMLTableRowElement;
        const baseColor =
          row.index % 2 === 0
            ? 'color-mix(in oklch, var(--card) 82%, var(--muted) 18%)'
            : 'var(--card)';
        rowEl.style.setProperty('--mrt-base-background-color', baseColor);
        rowEl.style.background = baseColor;
        rowEl.querySelectorAll('td').forEach(td => {
          (td as HTMLTableCellElement).style.background = baseColor;
        });
      },
    }),
    mantineTopToolbarProps: {
      style: {
        background: 'var(--card)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        rowGap: '0.5rem',
      },
    },
    mantineBottomToolbarProps: {
      className: 'mrt-themed-bottom',
      style: {
        background: 'var(--card)',
        borderTop: '1px solid var(--border)',
      },
    },
    // Style pagination controls (prev/next, numbers)
    mantinePaginationProps: {
      styles: paginationStyles,
    },
    mantineSearchTextInputProps: {
      variant: 'filled',
      placeholder: 'Search…',
      styles: searchInputStyles,
    },
  });

  return <MantineReactTable table={table} />;
}

export default DataTable;
