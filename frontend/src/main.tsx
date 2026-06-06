import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { ThemeProvider } from './store/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { I18nProvider } from './store/I18nContext';
import App from './App';
import './styles/global.scss';
import './styles/accessibility.scss';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (newSW) {
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              if (confirm('Yeni bir sürüm mevcut. Güncellensin mi?')) {
                newSW.postMessage({ type: 'SKIP_WAITING' });
              }
            }
          });
        }
      });
    }).catch(() => {});
  });
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) { refreshing = true; window.location.reload(); }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>
);
