import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { MantineProvider } from '@mantine/core';
import theme from '@/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import './index.css';
import BackgroundGrid from '@/components/layout/BackgroundGrid';
import { installAbsoluteUrlHistoryPatch } from '@/lib/history-absolute-url-patch';

// Install once on app boot (dev-only to keep production pristine)
if (import.meta.env.DEV) {
  installAbsoluteUrlHistoryPatch();
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <MantineProvider theme={theme} defaultColorScheme="auto">
            <BackgroundGrid>
              <App />
            </BackgroundGrid>
          </MantineProvider>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
