import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { registerSW } from 'virtual:pwa-register';

// Garantir que o app pegue a versão mais recente (evita cache antigo do PWA)
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
  onRegisterError(error) {
    console.error('SW registration error', error);
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <>
    <App />
    <PWAInstallPrompt />
  </>
);
