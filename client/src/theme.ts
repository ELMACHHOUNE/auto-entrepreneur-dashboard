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

// Central place to customize Mantine + Mantine React Table appearance
// You can tweak colors, radii, fonts, and component variables here.
const theme = createTheme({
  primaryColor: 'indigo',
  defaultRadius: 'md',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  components: {
    // Mantine React Table composes Mantine Table extensively, so changes here
    // will be reflected across MRT (headers, rows, pagination container, etc.)
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
          // Use Mantine CSS vars with light/dark fallback
          '--table-striped-color':
            'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
          '--table-hover-color':
            'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-5))',
          '--table-border-color':
            'light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
          '--table-font-size': rem(13),
        },
      }),
    }),

    // Common controls used by MRT
    Button: Button.extend({
      defaultProps: { size: 'sm', variant: 'light' },
    }),
    TextInput: TextInput.extend({
      defaultProps: { size: 'sm' },
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: { size: 'sm', variant: 'subtle' },
    }),
    Pagination: Pagination.extend({
      defaultProps: { size: 'sm', radius: 'md' },
    }),
    ScrollArea: ScrollArea.extend({
      defaultProps: { type: 'auto', scrollbarSize: 8 },
    }),
  },
});

export default theme;
