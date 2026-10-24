import './styles/main.css';
import { initTheme } from './theme.ts';
import { startRouter } from './router.ts';
import { BASE } from './base.ts';

initTheme();
startRouter();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${BASE}sw.js`, { scope: BASE }).catch((error: unknown) => {
      console.warn('Service worker registration failed', error);
    });
  });
}
