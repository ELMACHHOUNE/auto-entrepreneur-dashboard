import {
  createTheme,
  rem,
  Button,
  Table,
  TextInput,
  ActionIcon,
  Pagination,
  ScrollArea,
} from '@mantine/core';

const theme = createTheme({
  primaryColor: 'indigo',
  defaultRadius: 'md',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  components: {
    Table: Table.extend({
      defaultProps: {
        striped: 'odd',
        highlightOnHover: true,
        withTableBorder: false,
        horizontalSpacing: 'sm',
        verticalSpacing: 'xs',
      },
      vars: () => ({
        table: {
          '--table-striped-color': 'color-mix(in oklch, var(--muted) 65%, var(--card) 35%)',
          '--table-hover-color': 'color-mix(in oklch, var(--primary) 10%, var(--muted) 90%)',
          '--table-border-color': 'var(--border)',
          '--table-font-size': rem(13),
        },
      }),
      styles: {
        table: {
          backgroundColor: 'var(--card)',
          color: 'var(--foreground)',
          borderColor: 'var(--border)',
          borderRadius: 'var(--radius)',
        },
        tbody: {
          backgroundColor: 'var(--card)',
        },
        thead: {
          backgroundColor: 'var(--muted)',
        },
        th: {
          backgroundColor: 'var(--muted)',
          color: 'var(--foreground)',
          borderColor: 'var(--border)',
          fontWeight: 600,
          fontSize: rem(12),
        },
        tr: {
          transition: 'background-color 120ms ease',
        },
        td: {
          borderColor: 'var(--border)',
        },
        tfoot: {
          backgroundColor: 'var(--card)',
          borderTop: '1px solid var(--border)',
        },
        caption: {
          color: 'var(--muted-foreground)',
        },
      },
    }),

    // Common controls used by MRT
    Button: Button.extend({
      defaultProps: { size: 'sm', variant: 'light' },
    }),
    TextInput: TextInput.extend({
      defaultProps: { size: 'sm' },
      styles: {
        input: {
          backgroundColor: 'var(--card)',
          color: 'var(--foreground)',
          borderColor: 'var(--input)',
          '&::placeholder': { color: 'var(--muted-foreground)' },
          '&:focus': {
            borderColor: 'var(--ring)',
            boxShadow: '0 0 0 3px color-mix(in oklch, var(--ring) 25%, transparent)',
          },
        },
      },
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: { size: 'sm', variant: 'subtle' },
      styles: {
        root: {
          color: 'var(--foreground)',
          '&:hover': {
            backgroundColor: 'var(--muted)',
          },
        },
      },
    }),
    Pagination: Pagination.extend({
      defaultProps: { size: 'sm', radius: 'md' },
      styles: {
        control: {
          borderColor: 'var(--border)',
          color: 'var(--foreground)',
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: 'var(--muted)',
          },
          '&[data-active]': {
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            borderColor: 'var(--primary)',
          },
        },
      },
    }),
    ScrollArea: ScrollArea.extend({
      defaultProps: { type: 'auto', scrollbarSize: 8 },
      styles: {
        scrollbar: {
          backgroundColor: 'var(--muted)',
        },
        thumb: {
          backgroundColor: 'var(--secondary)',
        },
      },
    }),
  },
});

export default theme;
