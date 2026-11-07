import { get, set, del, update } from 'idb-keyval';
import type { Design, DesignMeta, UploadMeta } from '../types';
import { uid } from '../types';

export class StorageFullError extends Error {}

async function safeSet(key: string, value: unknown) {
  try {
    await set(key, value);
  } catch (e: any) {
    if (e?.name === 'QuotaExceededError') throw new StorageFullError('Browser storage is full');
    throw e;
  }
}

// ---------- designs ----------
export async function listDesigns(): Promise<DesignMeta[]> {
  const idx = (await get<DesignMeta[]>('designs:index')) ?? [];
  return idx.sort((a, b) => b.updatedAt - a.updatedAt);
}

export const loadDesign = (id: string) => get<Design>(`design:${id}`);

export async function saveDesign(d: Design, thumb?: string) {
  d.updatedAt = Date.now();
  await safeSet(`design:${d.id}`, d);
  await update<DesignMeta[]>('designs:index', (idx = []) => {
    const prev = idx.find((m) => m.id === d.id);
    const meta: DesignMeta = { id: d.id, title: d.title, width: d.width, height: d.height, updatedAt: d.updatedAt, thumb: thumb ?? prev?.thumb };
    return [meta, ...idx.filter((m) => m.id !== d.id)];
  });
}

export async function createDesign(init: Partial<Design> & { width: number; height: number }): Promise<Design> {
  const now = Date.now();
  const d: Design = { id: uid(), title: init.title ?? 'Untitled design', width: init.width, height: init.height, pages: init.pages ?? [{ version: '7', objects: [], background: '#ffffff' }], createdAt: now, updatedAt: now };
  await saveDesign(d);
  return d;
}

export async function deleteDesign(id: string) {
  await del(`design:${id}`);
  await update<DesignMeta[]>('designs:index', (idx = []) => idx.filter((m) => m.id !== id));
}

export async function duplicateDesign(id: string) {
  const d = await loadDesign(id);
  if (!d) return;
  const meta = (await listDesigns()).find((m) => m.id === id);
  const copy: Design = { ...structuredClone(d), id: uid(), title: `${d.title} (copy)`, createdAt: Date.now() };
  await saveDesign(copy, meta?.thumb);
}

export async function renameDesign(id: string, title: string) {
  const d = await loadDesign(id);
  if (!d) return;
  d.title = title;
  await saveDesign(d);
}

// ---------- uploads ----------
export const listUploads = async () => ((await get<UploadMeta[]>('uploads:index')) ?? []).sort((a, b) => b.createdAt - a.createdAt);
export const getUpload = (id: string) => get<string>(`upload:${id}`);

export async function addUpload(name: string, dataURL: string, width: number, height: number, thumb: string) {
  const meta: UploadMeta = { id: uid(), name, width, height, createdAt: Date.now(), thumb };
  await safeSet(`upload:${meta.id}`, dataURL);
  await update<UploadMeta[]>('uploads:index', (idx = []) => [meta, ...idx]);
  return meta;
}

export async function deleteUpload(id: string) {
  await del(`upload:${id}`);
  await update<UploadMeta[]>('uploads:index', (idx = []) => idx.filter((m) => m.id !== id));
}
