import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import { AuthProvider } from '@/context/AuthContext';
import './index.css';
import BackgroundGrid from '@/components/layout/BackgroundGrid';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BackgroundGrid>
          <App />
        </BackgroundGrid>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
