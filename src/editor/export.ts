import { jsPDF } from 'jspdf';
import type { Design } from '../types';
import { renderJSON } from './render';
import { saveBlob, saveDataURL } from '../platform/save';

export type ExportFormat = 'png' | 'jpg' | 'pdf' | 'svg' | 'paperhand';
export interface ExportOptions { format: ExportFormat; multiplier: number; transparent: boolean; pages: number[]; quality: number }

const safe = (s: string) => s.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'design';

export async function exportDesign(d: Design, o: ExportOptions, onProgress?: (done: number, total: number) => void) {
  if (o.format === 'paperhand') { const { downloadDesignFile } = await import('../store/backup'); await downloadDesignFile(d); return; }
  const name = safe(d.title);
  const pages = o.pages.length ? o.pages : d.pages.map((_, i) => i);
  const multi = pages.length > 1;
  if (o.format === 'pdf') {
    const pdf = new jsPDF({ unit: 'px', format: [d.width, d.height], orientation: d.width > d.height ? 'landscape' : 'portrait', hotfixes: ['px_scaling'], compress: true });
    for (let k = 0; k < pages.length; k++) {
      const r = await renderJSON(d.pages[pages[k]], d.width, d.height, { multiplier: o.multiplier, format: 'jpeg', quality: o.quality });
      if (k > 0) pdf.addPage([d.width, d.height], d.width > d.height ? 'landscape' : 'portrait');
      pdf.addImage(r.url, 'JPEG', 0, 0, d.width, d.height, undefined, 'FAST');
      r.canvas.dispose();
      onProgress?.(k + 1, pages.length);
    }
    await saveBlob(pdf.output('blob'), `${name}.pdf`);
    return;
  }
  for (let k = 0; k < pages.length; k++) {
    const i = pages[k];
    const suffix = multi ? `-${i + 1}` : '';
    const r = await renderJSON(d.pages[i], d.width, d.height, { multiplier: o.multiplier, format: o.format === 'jpg' ? 'jpeg' : 'png', quality: o.quality, transparent: o.transparent && o.format !== 'jpg' });
    if (o.format === 'svg') {
      await saveBlob(new Blob([r.svg], { type: 'image/svg+xml' }), `${name}${suffix}.svg`);
    } else {
      await saveDataURL(r.url, `${name}${suffix}.${o.format}`);
    }
    r.canvas.dispose();
    onProgress?.(k + 1, pages.length);
    if (multi) await new Promise((res) => setTimeout(res, 350)); // browsers throttle rapid downloads
  }
}
