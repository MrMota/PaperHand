import { useEffect, useState } from 'react';
import { applyUpdate } from '../platform/pwa';

/** Shows when a new version has downloaded. Never reloads on its own, so nobody loses a half-finished edit. */
export function UpdateBanner() {
  const [reg, setReg] = useState<ServiceWorkerRegistration | null>(null);
  useEffect(() => {
    const on = (e: Event) => setReg((e as CustomEvent).detail);
    window.addEventListener('pg-update-ready', on);
    return () => window.removeEventListener('pg-update-ready', on);
  }, []);
  if (!reg) return null;
  return (
    <div className="update-banner" role="status">
      <span>A new version of Paperhand is ready.</span>
      <button className="btn btn-primary btn-sm" onClick={() => applyUpdate(reg)}>Reload</button>
      <button className="btn btn-ghost btn-sm" onClick={() => setReg(null)}>Later</button>
    </div>
  );
}
