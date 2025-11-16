// Select filled variant styles
export const selectFilledStyles = {
  input: {
    background: 'var(--card)',
    color: 'var(--foreground)',
    borderColor: 'var(--input)',
  },
  dropdown: { background: 'var(--card)', borderColor: 'var(--border)' },
  option: {
    color: 'var(--foreground)',
    // Note: Mantine v7 applies styles inline; nested selectors like &[data-hovered]
    // are not supported in the styles prop (React will warn). Interactive states
    // are handled via global CSS in index.css using data attributes.
  },
  label: { color: 'var(--foreground)' },
};

// TextInput filled variant styles (match Selects and card look)
export const inputFilledStyles = {
  input: {
    background: 'var(--card)',
    color: 'var(--foreground)',
    borderColor: 'var(--input)',
  },
  label: { color: 'var(--foreground)' },
  description: { color: 'var(--muted-foreground)' },
};

// Accent-filled button styles (matches sidebar accent look)
export const buttonAccentStyles = {
  root: {
    background: 'var(--accent)',
    color: 'var(--accent-foreground)',
    borderColor: 'var(--accent)',
    '&:hover': {
      filter: 'brightness(0.95)',
    },
    '&:active': {
      filter: 'brightness(0.9)',
    },
  },
  label: { color: 'inherit' },
};

// Neutral button styles (card background, subtle hover)
export const buttonNeutralStyles = {
  root: {
    background: 'var(--card)',
    color: 'var(--foreground)',
    borderColor: 'var(--input)',
    '&:hover': {
      background: 'var(--muted)',
    },
  },
  label: { color: 'inherit' },
};

// Modal style presets for consistent theming across app
export const modalStyles = {
  success: {
    content: {
      background: 'color-mix(in oklch, var(--success) 12%, var(--card) 88%)',
      color: 'var(--foreground)',
      border: '1px solid var(--success)',
      borderRadius: 'var(--radius)',
    },
    header: {
      background: 'color-mix(in oklch, var(--success) 18%, var(--card) 82%)',
      borderBottom: '1px solid var(--success)',
    },
    title: { fontWeight: 600, fontSize: '0.95rem' },
    body: { paddingTop: '0.5rem' },
    close: {
      color: 'var(--accent-foreground)',
      background: 'var(--accent)',
      borderRadius: 'var(--radius-sm)',
      // Interactive states are defined via CSS (see index.css) to avoid nested
      // selectors in inline styles.
    },
  },
  accent: {
    content: {
      background: 'var(--card)',
      color: 'var(--foreground)',
      border: '1px solid var(--accent)',
      borderRadius: 'var(--radius)',
    },
    header: {
      background: 'color-mix(in oklch, var(--accent) 16%, var(--card) 84%)',
      borderBottom: '1px solid var(--accent)',
    },
    title: { fontWeight: 600, fontSize: '0.95rem' },
    body: { paddingTop: '0.5rem' },
    close: {
      color: 'var(--accent-foreground)',
      background: 'var(--accent)',
      borderRadius: 'var(--radius-sm)',
      // Interactive states are defined via CSS (see index.css).
    },
  },
} as const;
