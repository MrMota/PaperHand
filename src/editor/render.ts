import { StaticCanvas, FabricImage, type FabricObject } from 'fabric';
import type { PageJSON } from '../types';
import type { PageSpec } from '../content/spec';
import { buildObject, toFabricFill, resolveSrc, loadImageEl } from '../content/spec';
import { ensureFonts, fontsInJSON } from '../fonts';

export const PROPS = ['pgId', 'pgName', 'pgKind', 'pgLocked', 'pgAdjust', 'pgFilter', 'pgOriginalSrc', 'pgFrame', 'pgFrameBox', 'pgTextBg', 'pgUpper', 'selectable', 'evented', 'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation', 'hasControls'];

export function serialize(c: StaticCanvas): PageJSON {
  return c.toObject(PROPS);
}

export async function setBackground(c: StaticCanvas, bg: PageSpec['bg'], w: number, h: number) {
  c.backgroundImage = undefined;
  if (typeof bg === 'object' && 'image' in bg) {
    const el = await loadImageEl(resolveSrc(bg.image, w, h));
    const img = new FabricImage(el);
    const s = Math.max(w / el.naturalWidth, h / el.naturalHeight);
    img.set({ scaleX: s, scaleY: s, left: (w - el.naturalWidth * s) / 2, top: (h - el.naturalHeight * s) / 2, originX: 'left', originY: 'top' });
    c.backgroundImage = img;
    c.backgroundColor = '#ffffff';
  } else {
    c.backgroundColor = toFabricFill(bg, w, h);
  }
}

/** Build a page JSON from a template page spec, scaled to the target size. */
export async function specToJSON(spec: PageSpec, srcW: number, srcH: number, w = srcW, h = srcH): Promise<PageJSON> {
  const el = document.createElement('canvas');
  const c = new StaticCanvas(el, { width: w, height: h, renderOnAddRemove: false });
  await ensureFonts(spec.items.flatMap((i) => (i.t === 'text' ? [i.font] : [])));
  await setBackground(c, spec.bg, w, h);
  const objs = await Promise.all(spec.items.map(buildObject));
  const s = Math.min(w / srcW, h / srcH);
  const ox = (w - srcW * s) / 2, oy = (h - srcH * s) / 2;
  objs.forEach((o) => {
    if (s !== 1 || ox || oy) o.set({ left: o.left! * s + ox, top: o.top! * s + oy, scaleX: o.scaleX! * s, scaleY: o.scaleY! * s });
    c.add(o);
  });
  const json = serialize(c);
  c.dispose();
  return json;
}

export async function renderJSON(json: PageJSON, w: number, h: number, opts: { multiplier?: number; format?: 'png' | 'jpeg'; quality?: number; transparent?: boolean } = {}) {
  const el = document.createElement('canvas');
  const c = new StaticCanvas(el, { width: w, height: h, renderOnAddRemove: false, enableRetinaScaling: false });
  await ensureFonts(fontsInJSON(json));
  await c.loadFromJSON(json);
  if (opts.transparent) { c.backgroundColor = ''; c.backgroundImage = undefined; }
  if (opts.format === 'jpeg' && !c.backgroundColor) c.backgroundColor = '#ffffff';
  c.renderAll();
  const url = c.toDataURL({ multiplier: opts.multiplier ?? 1, format: opts.format ?? 'png', quality: opts.quality ?? 0.92 });
  const svg = () => c.toSVG();
  const result = { url, svg: svg(), canvas: c };
  return result;
}

export async function thumbnailOf(json: PageJSON, w: number, h: number, max = 360) {
  const m = Math.min(1, max / Math.max(w, h));
  const r = await renderJSON(json, w, h, { multiplier: m, format: 'jpeg', quality: 0.8 });
  r.canvas.dispose();
  return r.url;
}

const tplThumbCache = new Map<string, string>();
const queue: (() => Promise<void>)[] = [];
let running = false;
async function pump() {
  if (running) return;
  running = true;
  while (queue.length) await queue.shift()!();
  running = false;
}
/** Render template thumbnails one at a time so the UI stays responsive. */
export function templateThumb(id: string, spec: PageSpec, w: number, h: number): Promise<string> {
  const hit = tplThumbCache.get(id);
  if (hit) return Promise.resolve(hit);
  return new Promise((res) => {
    queue.push(async () => {
      try {
        const json = await specToJSON(spec, w, h);
        const url = await thumbnailOf(json, w, h, 420);
        tplThumbCache.set(id, url);
        res(url);
      } catch (e) {
        console.error(e);
        res('');
      }
      await new Promise((r) => setTimeout(r, 0));
    });
    pump();
  });
}

export type { FabricObject };
