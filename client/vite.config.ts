import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/react/') || id.includes('react-dom')) return 'react';
          if (id.includes('/@mantine/')) return 'mantine';
          if (id.includes('mantine-react-table')) return 'table';
          if (id.includes('@tanstack/react-query')) return 'query';
          if (id.includes('/motion')) return 'motion';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('/tslib')) return 'tslib';
        },
      },
    },
    // Optional: reduce warning noise; you can tune or remove later
    chunkSizeWarningLimit: 800,
  },
});
