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
import { useMemo } from 'react';

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
  globalFilter?: string;
  onGlobalFilterChange?: (val: string) => void;
  renderRowActions?: (props: { row: MRT_Row<T> }) => React.ReactNode;
  renderTopToolbarCustomActions?: () => React.ReactNode;
  // Customize border color of the surrounding card/container
  // "border" uses the neutral border token; others use brand tokens
  borderTone?: 'border' | 'primary' | 'accent' | 'secondary' | 'success';
  // Optional: visually separate groups of rows (e.g., quarters) with an accent separator line
  groupByKey?: (rowOriginal: T) => string | number;
  groupSeparatorTone?: 'border' | 'primary' | 'accent' | 'secondary' | 'success';
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
}: DataTableProps<T>) {
  // Memo columns to prevent re-renders
  const memoCols = useMemo(() => columns, [columns]);

  const borderVar = borderTone === 'border' ? 'var(--border)' : `var(--${borderTone})`;
  const groupSepVar =
    groupSeparatorTone === 'border' ? 'var(--border)' : `var(--${groupSeparatorTone})`;

  // Provide a safe default pagination object if none is supplied to avoid runtime errors in MRT
  const safePagination = pagination ?? {
    pageIndex: 0,
    pageSize: data.length > 0 ? data.length : 10,
  };

  const table = useMantineReactTable<T>({
    columns: memoCols,
    data,
    rowCount,
    enableRowActions,
    manualFiltering: manualFiltering,
    manualPagination: manualPagination,
    state: {
      isLoading: loading,
      globalFilter,
      pagination: safePagination,
    },
    onGlobalFilterChange: v => onGlobalFilterChange?.(v ?? ''),
    onPaginationChange,
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
      },
    },
    mantineBottomToolbarProps: {
      style: {
        background: 'var(--card)',
        borderTop: '1px solid var(--border)',
      },
    },
    mantineSearchTextInputProps: {
      variant: 'filled',
      placeholder: 'Search…',
      styles: {
        input: {
          background: 'var(--card)',
          color: 'var(--foreground)',
          borderColor: 'var(--input)',
        },
      },
    },
  });

  return <MantineReactTable table={table} />;
}

export default DataTable;
