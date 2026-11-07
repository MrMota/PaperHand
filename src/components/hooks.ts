import { useSyncExternalStore } from 'react';
import type { Editor } from '../editor/Editor';
import { addUpload } from '../store/db';

export function useEditorVersion(ed: Editor | null) {
  return useSyncExternalStore(
    (cb) => (ed ? ed.subscribe(cb) : () => {}),
    () => ed?.version ?? 0,
  );
}

export async function fileToDataURL(file: Blob): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Not a readable image')); i.src = src; });
}

export async function downscale(src: string, max: number, type = 'image/png', q = 0.92) {
  const img = await loadImg(src);
  const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * s), h = Math.round(img.naturalHeight * s);
  if (s === 1 && max > 1000 && src.startsWith('data:image/')) return { url: src, w, h };
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d')!.drawImage(img, 0, 0, w, h);
  return { url: c.toDataURL(type, q), w, h };
}

export const MAX_UPLOAD_MB = 25;

/** Store an uploaded image file locally and return its data URL. */
export async function ingestImage(file: File) {
  if (!file.type.startsWith('image/')) throw new Error(`“${file.name}” is not an image`);
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`“${file.name}” is larger than ${MAX_UPLOAD_MB} MB`);
  const raw = await fileToDataURL(file);
  const keepAlpha = /png|webp|gif|svg/.test(file.type);
  const big = await downscale(raw, 2400, keepAlpha ? 'image/png' : 'image/jpeg', 0.92);
  const thumb = await downscale(big.url, 320, keepAlpha ? 'image/png' : 'image/jpeg', 0.8);
  const meta = await addUpload(file.name, big.url, big.w, big.h, thumb.url);
  return { meta, url: big.url };
}
