import React from 'react';
import { createRoot } from 'react-dom/client';
import './fonts';
import './styles/tokens.css';
import './styles/app.css';
import { App } from './App';
import { ToastProvider } from './components/ui';
import { registerServiceWorker } from './platform/pwa';
import { UpdateBanner } from './components/UpdateBanner';

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
      <UpdateBanner />
    </ToastProvider>
  </React.StrictMode>,
);
