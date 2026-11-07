import { clear } from 'idb-keyval';
import type { Design } from '../types';
import { uid } from '../types';
import { listDesigns, loadDesign, saveDesign, listUploads, getUpload, addUpload } from './db';
import { thumbnailOf } from '../editor/render';

const DESIGN_FORMAT = 'paperhand-design';
const BACKUP_FORMAT = 'paperhand-backup';

function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
const safe = (s: string) => s.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'design';
const stamp = () => new Date().toISOString().slice(0, 10);

export function downloadDesignFile(d: Design) {
  download(JSON.stringify({ format: DESIGN_FORMAT, version: 1, exportedAt: new Date().toISOString(), design: d }), `${safe(d.title)}.paperhand`);
}

export async function backupEverything() {
  const designs: Design[] = [];
  for (const m of await listDesigns()) { const d = await loadDesign(m.id); if (d) designs.push(d); }
  const uploads = [];
  for (const u of await listUploads()) { const data = await getUpload(u.id); if (data) uploads.push({ ...u, data }); }
  download(JSON.stringify({ format: BACKUP_FORMAT, version: 1, exportedAt: new Date().toISOString(), designs, uploads }), `paperhand-backup-${stamp()}.paperhand`);
  return { designs: designs.length, uploads: uploads.length };
}

function validDesign(d: any): d is Design {
  return d && typeof d === 'object' && typeof d.title === 'string' && Number.isFinite(d.width) && Number.isFinite(d.height)
    && d.width >= 1 && d.height >= 1 && d.width <= 20000 && d.height <= 20000 && Array.isArray(d.pages) && d.pages.length > 0
    && d.pages.every((p: any) => p && typeof p === 'object' && Array.isArray(p.objects ?? []));
}

/** Import a .paperhand file. Designs always get new ids, so importing never overwrites existing work. */
export async function importFile(file: File): Promise<{ designs: number; uploads: number; firstId?: string }> {
  let data: any;
  try { data = JSON.parse(await file.text()); } catch { throw new Error(`“${file.name}” isn’t a Paperhand file`); }
  const list: any[] = data?.format === DESIGN_FORMAT ? [data.design] : data?.format === BACKUP_FORMAT ? data.designs ?? [] : [];
  if (!list.length && data?.format !== BACKUP_FORMAT) throw new Error(`“${file.name}” isn’t a Paperhand file`);
  let firstId: string | undefined;
  let n = 0;
  for (const raw of list) {
    if (!validDesign(raw)) continue;
    const now = Date.now();
    const d: Design = { id: uid(), title: raw.title.slice(0, 200), width: raw.width, height: raw.height, pages: raw.pages.map((p: any) => ({ ...p, pageId: uid() })), createdAt: raw.createdAt ?? now, updatedAt: now };
    let thumb: string | undefined;
    try { thumb = await thumbnailOf(d.pages[0], d.width, d.height, 360); } catch { /* still import */ }
    await saveDesign(d, thumb);
    firstId ??= d.id;
    n++;
  }
  let u = 0;
  for (const up of data?.format === BACKUP_FORMAT ? data.uploads ?? [] : []) {
    if (typeof up?.data !== 'string' || !up.data.startsWith('data:image/')) continue;
    await addUpload(String(up.name ?? 'image'), up.data, +up.width || 0, +up.height || 0, typeof up.thumb === 'string' ? up.thumb : up.data);
    u++;
  }
  if (!n && !u) throw new Error(`“${file.name}” has no designs Paperhand can open`);
  return { designs: n, uploads: u, firstId };
}

export async function deleteEverything() { await clear(); }
