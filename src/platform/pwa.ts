import { isDesktop, isNative } from './native';

/** Registers the service worker (web only, production only) and reports when an update is waiting. */
export function registerServiceWorker() {
  if (isNative() || isDesktop() || !import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
      const announce = () => window.dispatchEvent(new CustomEvent('pg-update-ready', { detail: reg }));
      if (reg.waiting && navigator.serviceWorker.controller) announce();
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) announce(); });
      });
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloading && sessionStorage.getItem('pg-apply-update')) { reloading = true; sessionStorage.removeItem('pg-apply-update'); location.reload(); } });
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    } catch (e) { console.warn('Service worker registration failed', e); }
  });
}

export function applyUpdate(reg: ServiceWorkerRegistration) {
  try { sessionStorage.setItem('pg-apply-update', '1'); } catch { /* private mode */ }
  reg.waiting?.postMessage('skip-waiting');
}

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferred: BIPEvent | null = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BIPEvent; window.dispatchEvent(new Event('pg-installable')); });
window.addEventListener('appinstalled', () => { deferred = null; window.dispatchEvent(new Event('pg-installable')); });
export const canInstall = () => !!deferred;
export async function promptInstall() { if (!deferred) return; await deferred.prompt(); await deferred.userChoice; deferred = null; window.dispatchEvent(new Event('pg-installable')); }
