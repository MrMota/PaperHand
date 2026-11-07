export type BgMode = 'object' | 'portrait' | 'color';
export interface BgProgress { phase: 'download' | 'running' | 'compose'; pct?: number }

let worker: Worker | null = null;
let seq = 0;

function getWorker() {
  worker ??= new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  return worker;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

/** Run the segmentation model; returns the cut-out as a PNG data URL at the original resolution. */
async function modelRemove(src: string, kind: 'object' | 'portrait', onProgress?: (p: BgProgress) => void): Promise<string> {
  const w = getWorker();
  const id = ++seq;
  const mask = await new Promise<{ width: number; height: number; channels: number; data: Uint8ClampedArray }>((resolve, reject) => {
    const files = new Map<string, [number, number]>();
    const onMsg = (e: MessageEvent) => {
      const m = e.data;
      if (m.type === 'progress') {
        files.set(m.file, [m.loaded, m.total]);
        let l = 0, t = 0; files.forEach(([a, b]) => { l += a; t += b; });
        onProgress?.({ phase: 'download', pct: t ? (l / t) * 100 : undefined });
        return;
      }
      if (m.id !== id) return;
      if (m.type === 'status') onProgress?.({ phase: 'running' });
      if (m.type === 'done') { w.removeEventListener('message', onMsg); resolve(m); }
      if (m.type === 'error') { w.removeEventListener('message', onMsg); reject(new Error(m.message)); }
    };
    w.addEventListener('message', onMsg);
    w.postMessage({ id, src, kind });
  });
  onProgress?.({ phase: 'compose' });
  const img = await loadImage(src);
  const W = img.naturalWidth, H = img.naturalHeight;
  // model output → canvas → scale to original size → use its alpha as mask
  const mc = document.createElement('canvas');
  mc.width = mask.width; mc.height = mask.height;
  const mctx = mc.getContext('2d')!;
  const id4 = mctx.createImageData(mask.width, mask.height);
  if (mask.channels === 4) id4.data.set(mask.data);
  else for (let i = 0, j = 0; i < mask.data.length; i += mask.channels, j += 4) { id4.data[j + 3] = mask.data[i]; }
  mctx.putImageData(id4, 0, 0);
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const octx = out.getContext('2d')!;
  octx.drawImage(img, 0, 0);
  octx.globalCompositeOperation = 'destination-in';
  octx.drawImage(mc, 0, 0, W, H);
  return out.toDataURL('image/png');
}

/**
 * Offline fallback: flood-fills from the image border, removing pixels close to the border colour.
 * Works well on product shots and graphics with plain backgrounds.
 */
export async function colorRemove(src: string, tolerance = 42, feather = 2): Promise<string> {
  const img = await loadImage(src);
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, W, H);
  const px = d.data;
  // background reference: median of border pixels per channel
  const border: number[][] = [[], [], []];
  const sample = (x: number, y: number) => { const i = (y * W + x) * 4; border[0].push(px[i]); border[1].push(px[i + 1]); border[2].push(px[i + 2]); };
  const step = Math.max(1, Math.floor((W + H) / 400));
  for (let x = 0; x < W; x += step) { sample(x, 0); sample(x, H - 1); }
  for (let y = 0; y < H; y += step) { sample(0, y); sample(W - 1, y); }
  const med = border.map((a) => a.sort((p, q) => p - q)[a.length >> 1]);
  const tol2 = tolerance * tolerance * 3;
  const dist = (i: number) => { const r = px[i] - med[0], g = px[i + 1] - med[1], b = px[i + 2] - med[2]; return r * r + g * g + b * b; };
  const visited = new Uint8Array(W * H);
  const stack: number[] = [];
  const push = (p: number) => { if (!visited[p] && dist(p * 4) <= tol2) { visited[p] = 1; stack.push(p); } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (stack.length) {
    const p = stack.pop()!;
    const x = p % W, y = (p / W) | 0;
    if (x > 0) push(p - 1);
    if (x < W - 1) push(p + 1);
    if (y > 0) push(p - W);
    if (y < H - 1) push(p + W);
  }
  for (let p = 0; p < W * H; p++) if (visited[p]) px[p * 4 + 3] = 0;
  // soften the edge: partially transparent pixels next to removed ones, weighted by colour distance
  if (feather > 0) {
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const p = y * W + x;
      if (visited[p]) continue;
      if (visited[p - 1] || visited[p + 1] || visited[p - W] || visited[p + W]) {
        const t = Math.min(1, Math.sqrt(dist(p * 4) / (tol2 * 2.5)));
        px[p * 4 + 3] = Math.round(px[p * 4 + 3] * (0.35 + 0.65 * t));
      }
    }
  }
  ctx.putImageData(d, 0, 0);
  return c.toDataURL('image/png');
}

export async function removeBackground(src: string, mode: BgMode, onProgress?: (p: BgProgress) => void): Promise<{ url: string; usedFallback: boolean; error?: string }> {
  if (mode === 'color') return { url: await colorRemove(src), usedFallback: false };
  try {
    return { url: await modelRemove(src, mode, onProgress), usedFallback: false };
  } catch (e: any) {
    console.warn('Model background removal failed, using colour fallback', e);
    return { url: await colorRemove(src), usedFallback: true, error: String(e?.message ?? e) };
  }
}
