import { Rect, Ellipse, Path, Textbox, FabricImage, Gradient, Shadow, Group, Line, Polyline, loadSVGFromString, util, type FabricObject } from 'fabric';
import type { FillSpec, GradientSpec } from './palette';
import { genImage } from './generated';
import { SHAPES, type LineDef } from './shapes';
import { uid } from '../types';

export type Spec =
  | { t: 'text'; text: string; x: number; y: number; w: number; size: number; font: string; color: FillSpec; weight?: number | string; italic?: boolean; align?: 'left' | 'center' | 'right' | 'justify'; lh?: number; ls?: number; upper?: boolean; shadow?: string; stroke?: string; sw?: number; bg?: string; opacity?: number; angle?: number; underline?: boolean }
  | { t: 'rect'; x: number; y: number; w: number; h: number; fill: FillSpec; rx?: number; stroke?: string; sw?: number; opacity?: number; angle?: number; shadow?: string }
  | { t: 'ellipse'; x: number; y: number; w: number; h: number; fill: FillSpec; stroke?: string; sw?: number; opacity?: number }
  | { t: 'shape'; shape: string; x: number; y: number; w: number; h: number; fill: FillSpec; stroke?: string; sw?: number; opacity?: number; angle?: number }
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; stroke: string; sw: number; dash?: number[] }
  | { t: 'img'; src: string; x: number; y: number; w: number; h: number; frame?: string; opacity?: number; angle?: number }
  | { t: 'svg'; svg: string; x: number; y: number; w: number; h?: number; angle?: number };

export interface PageSpec { bg: FillSpec | { image: string }; items: Spec[] }

export function toFabricFill(f: FillSpec | undefined, w: number, h: number): any {
  if (!f || typeof f === 'string') return f ?? 'transparent';
  return makeGradient(f, w, h);
}

export function makeGradient(g: GradientSpec, w: number, h: number) {
  const colorStops = g.stops.map(([offset, color]) => ({ offset, color }));
  if (g.type === 'radial') {
    const r = Math.max(w, h) * 0.65;
    return new Gradient({ type: 'radial', coords: { x1: w / 2, y1: h / 2, r1: 0, x2: w / 2, y2: h / 2, r2: r }, colorStops });
  }
  const a = (((g.angle ?? 180) - 90) * Math.PI) / 180;
  const len = Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a));
  const cx = w / 2, cy = h / 2, dx = (Math.cos(a) * len) / 2, dy = (Math.sin(a) * len) / 2;
  return new Gradient({ type: 'linear', coords: { x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy }, colorStops });
}

export function parseShadow(s?: string) {
  if (!s) return undefined;
  // "color blur offX offY"
  const [color, blur, x, y] = s.split(' ');
  return new Shadow({ color, blur: +blur, offsetX: +x, offsetY: +y });
}

export function shapePath(id: string) {
  return SHAPES.find((s) => s.id === id)?.d ?? SHAPES[0].d;
}

export function makeShape(id: string, opts: { left: number; top: number; w: number; h: number; fill: any; stroke?: string; sw?: number }) {
  const p = new Path(shapePath(id), { fill: opts.fill, stroke: opts.stroke, strokeWidth: opts.sw ?? 0, strokeUniform: true, fillRule: 'evenodd' });
  const sx = opts.w / (p.width || 100), sy = opts.h / (p.height || 100);
  p.set({ left: opts.left, top: opts.top, scaleX: sx, scaleY: sy, pgKind: 'shape', pgName: SHAPES.find((s) => s.id === id)?.name ?? 'Shape' } as any);
  return p;
}

export function makeLine(def: LineDef, left: number, top: number, length: number, color = '#1E1B16') {
  const sw = def.width;
  const common = { stroke: color, strokeWidth: sw, strokeDashArray: def.dash ?? null, strokeLineCap: def.cap ?? (def.dash ? 'butt' : 'round'), fill: '' } as const;
  if (!def.arrowEnd && !def.arrowStart) {
    const l = new Line([0, 0, length, 0], { ...common, left, top, pgKind: 'line', pgName: def.name } as any);
    return l;
  }
  const head = sw * 3;
  const parts: FabricObject[] = [new Line([def.arrowStart ? head / 2 : 0, head, def.arrowEnd ? length - head / 2 : length, head], { ...common })];
  if (def.arrowEnd) parts.push(new Polyline([{ x: length - head * 1.4, y: 0 }, { x: length, y: head }, { x: length - head * 1.4, y: head * 2 }], { ...common, strokeDashArray: null, strokeLineJoin: 'round' }));
  if (def.arrowStart) parts.push(new Polyline([{ x: head * 1.4, y: 0 }, { x: 0, y: head }, { x: head * 1.4, y: head * 2 }], { ...common, strokeDashArray: null, strokeLineJoin: 'round' }));
  return new Group(parts, { left, top, pgKind: 'line', pgName: def.name } as any);
}

export async function makeSvg(svg: string, left: number, top: number, w: number, name = 'Graphic') {
  const { objects, options } = await loadSVGFromString(svg);
  const obj = util.groupSVGElements(objects.filter(Boolean) as FabricObject[], options);
  const s = w / (obj.width || 1);
  obj.set({ left, top, scaleX: s, scaleY: s, pgKind: 'graphic', pgName: name } as any);
  return obj;
}

export function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}

/** Fit an image into a box with "cover" behaviour using crop, so it can carry a frame (clip shape). */
export function coverImage(img: FabricImage, boxW: number, boxH: number, frame?: string) {
  const el = img.getElement() as HTMLImageElement;
  const nw = el.naturalWidth || el.width, nh = el.naturalHeight || el.height;
  const s = Math.max(boxW / nw, boxH / nh);
  const cw = boxW / s, ch = boxH / s;
  img.set({ width: cw, height: ch, cropX: (nw - cw) / 2, cropY: (nh - ch) / 2, scaleX: s, scaleY: s, pgFrameBox: [boxW, boxH] } as any);
  applyFrame(img, frame);
}

export function applyFrame(img: FabricImage, frame?: string) {
  (img as any).pgFrame = frame || undefined;
  if (!frame || frame === 'square') { img.clipPath = undefined; img.dirty = true; return; }
  const w = img.width!, h = img.height!;
  const clip = new Path(shapePath(frame), { fillRule: 'evenodd', originX: 'center', originY: 'center' });
  clip.set({ scaleX: w / (clip.width || 100), scaleY: h / (clip.height || 100), left: 0, top: 0 });
  img.clipPath = clip;
  img.dirty = true;
}

export async function makeImage(src: string, left: number, top: number, w: number, h?: number, frame?: string) {
  const el = await loadImageEl(src);
  const img = new FabricImage(el, { left, top, pgKind: frame ? 'frame' : 'image', pgName: frame ? 'Frame' : 'Image' } as any);
  const height = h ?? (w * el.naturalHeight) / el.naturalWidth;
  if (frame) coverImage(img, w, height, frame);
  else if (h) coverImage(img, w, h);
  else img.set({ scaleX: w / el.naturalWidth, scaleY: w / el.naturalWidth });
  return img;
}

export const resolveSrc = (src: string, w = 1200, h = 900) => (src.startsWith('gen:') ? genImage(src.slice(4), w, h) : src);

export async function buildObject(s: Spec): Promise<FabricObject> {
  let o: FabricObject;
  switch (s.t) {
    case 'text': {
      const tb = new Textbox(s.upper ? s.text.toUpperCase() : s.text, {
        left: s.x, top: s.y, width: s.w, fontSize: s.size, fontFamily: s.font, fill: toFabricFill(s.color, s.w, s.size), fontWeight: s.weight ?? 400,
        fontStyle: s.italic ? 'italic' : 'normal', textAlign: s.align ?? 'left', lineHeight: s.lh ?? 1.16, charSpacing: s.ls ?? 0,
        shadow: parseShadow(s.shadow), stroke: s.stroke, strokeWidth: s.sw ?? 0, paintFirst: 'stroke', textBackgroundColor: s.bg ?? '', underline: !!s.underline,
        pgKind: 'text', pgName: 'Text', pgUpper: !!s.upper,
      } as any);
      o = tb;
      break;
    }
    case 'rect':
      o = new Rect({ left: s.x, top: s.y, width: s.w, height: s.h, rx: s.rx ?? 0, ry: s.rx ?? 0, fill: toFabricFill(s.fill, s.w, s.h), stroke: s.stroke, strokeWidth: s.sw ?? 0, strokeUniform: true, shadow: parseShadow(s.shadow), pgKind: 'shape', pgName: 'Rectangle' } as any);
      break;
    case 'ellipse':
      o = new Ellipse({ left: s.x, top: s.y, rx: s.w / 2, ry: s.h / 2, fill: toFabricFill(s.fill, s.w, s.h), stroke: s.stroke, strokeWidth: s.sw ?? 0, strokeUniform: true, pgKind: 'shape', pgName: 'Ellipse' } as any);
      break;
    case 'shape':
      o = makeShape(s.shape, { left: s.x, top: s.y, w: s.w, h: s.h, fill: toFabricFill(s.fill, 100, 100), stroke: s.stroke, sw: s.sw });
      break;
    case 'line':
      o = new Line([s.x1, s.y1, s.x2, s.y2], { stroke: s.stroke, strokeWidth: s.sw, strokeDashArray: s.dash ?? null, strokeLineCap: 'round', pgKind: 'line', pgName: 'Line' } as any);
      o.set({ left: Math.min(s.x1, s.x2), top: Math.min(s.y1, s.y2) - s.sw / 2 });
      break;
    case 'img':
      o = await makeImage(resolveSrc(s.src, Math.round(s.w), Math.round(s.h)), s.x, s.y, s.w, s.h, s.frame);
      break;
    case 'svg':
      o = await makeSvg(s.svg, s.x, s.y, s.w);
      break;
  }
  const extra: any = { pgId: uid() };
  if ('opacity' in s && s.opacity != null) extra.opacity = s.opacity;
  if ('angle' in s && s.angle) extra.angle = s.angle;
  o.set(extra);
  return o;
}
