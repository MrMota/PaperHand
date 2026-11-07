import { Canvas, ActiveSelection, Group, Textbox, FabricImage, PencilBrush, Shadow, filters, cache, util, config, type FabricObject, type TPointerEventInfo } from 'fabric';
import './fabricSetup';
import type { Design, PageJSON } from '../types';
import { uid } from '../types';
import { PROPS, serialize, setBackground, specToJSON } from './render';
import type { PageSpec } from '../content/spec';
import { makeShape, makeLine, makeSvg, makeImage, toFabricFill, applyFrame, loadImageEl } from '../content/spec';
import type { LineDef } from '../content/shapes';
import type { FillSpec } from '../content/palette';
import { ensureFonts, fontsInJSON } from '../fonts';

config.textureSize = 4096;

export type SelKind = 'none' | 'text' | 'shape' | 'image' | 'frame' | 'line' | 'graphic' | 'drawing' | 'group' | 'multi';

export interface Adjust { brightness: number; contrast: number; saturation: number; hue: number; blur: number; vibrance: number; noise: number; pixelate: number }
export const DEFAULT_ADJUST: Adjust = { brightness: 0, contrast: 0, saturation: 0, hue: 0, blur: 0, vibrance: 0, noise: 0, pixelate: 0 };
export const FILTER_PRESETS = ['None', 'Mono', 'Noir', 'Sepia', 'Vintage', 'Kodachrome', 'Technicolor', 'Polaroid', 'Retro', 'Warm', 'Cool', 'Fade', 'Vivid', 'Dreamy'] as const;
export type FilterPreset = (typeof FILTER_PRESETS)[number];

type Listener = () => void;
const HISTORY_CAP = 60;

export class Editor {
  canvas: Canvas;
  design: Design;
  pages: PageJSON[];
  current = 0;
  zoom = 1;
  private listeners = new Set<Listener>();
  private history = new Map<string, { stack: string[]; idx: number }>();
  private loading = false;
  private clipboard: FabricObject | null = null;
  private guides: { v: number[]; h: number[] } = { v: [], h: [] };
  onChange?: (reason: string) => void;
  version = 0;
  snapping = true;
  disposed = false;

  constructor(el: HTMLCanvasElement, design: Design) {
    this.design = design;
    this.pages = design.pages.map((p) => ({ ...p, pageId: p.pageId ?? uid() }));
    this.canvas = new Canvas(el, {
      width: design.width, height: design.height, preserveObjectStacking: true, selectionColor: 'rgba(29,95,209,0.08)', selectionBorderColor: '#1D5FD1', selectionLineWidth: 1,
      controlsAboveOverlay: true, stopContextMenu: false, fireRightClick: true, targetFindTolerance: 6,
    });
    const c = this.canvas;
    c.on('selection:created', () => this.emit());
    c.on('selection:updated', () => this.emit());
    c.on('selection:cleared', () => this.emit());
    c.on('object:modified', () => this.commit('modify'));
    c.on('text:editing:exited', () => this.commit('text'));
    c.on('text:changed', () => this.emit());
    c.on('path:created', (e: any) => { e.path.set({ pgKind: 'drawing', pgName: 'Drawing', pgId: uid() }); this.commit('draw'); });
    c.on('object:moving', (e) => this.snap(e.target));
    c.on('object:scaling', () => (this.guides = { v: [], h: [] }));
    c.on('mouse:up', () => { if (this.guides.v.length || this.guides.h.length) { this.guides = { v: [], h: [] }; c.requestRenderAll(); } });
    c.on('after:render', () => this.drawGuides());
  }

  // ---------- events ----------
  subscribe(fn: Listener) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { if (this.disposed) return; this.version++; this.listeners.forEach((l) => l()); }

  get page() { return this.pages[this.current]; }
  get width() { return this.design.width; }
  get height() { return this.design.height; }

  dispose() { this.disposed = true; clearTimeout(this.commitTimer); this.listeners.clear(); this.canvas.dispose(); }

  // ---------- pages ----------
  async init() { await this.loadPage(0, true); }

  async loadPage(i: number, initial = false) {
    if (!initial) this.flush();
    this.current = Math.max(0, Math.min(i, this.pages.length - 1));
    const json = this.page;
    this.loading = true;
    await ensureFonts(fontsInJSON(json));
    this.canvas.discardActiveObject();
    await this.canvas.loadFromJSON(json);
    this.loading = false;
    this.canvas.requestRenderAll();
    const h = this.history.get(json.pageId);
    if (!h) this.history.set(json.pageId, { stack: [JSON.stringify(json)], idx: 0 });
    this.emit();
  }

  /** Serialize the live canvas into the current page slot. */
  flush() {
    if (this.loading || this.disposed) return;
    this.pages[this.current] = { ...serialize(this.canvas), pageId: this.page.pageId };
  }

  commit(reason = 'change') {
    if (this.loading || this.disposed) return;
    this.flush();
    const id = this.page.pageId;
    const h = this.history.get(id) ?? { stack: [], idx: -1 };
    const snap = JSON.stringify(this.page);
    if (h.stack[h.idx] !== snap) {
      h.stack = h.stack.slice(0, h.idx + 1);
      h.stack.push(snap);
      if (h.stack.length > HISTORY_CAP) h.stack.shift();
      h.idx = h.stack.length - 1;
      this.history.set(id, h);
    }
    this.emit();
    this.onChange?.(reason);
  }

  get canUndo() { const h = this.history.get(this.page?.pageId); return !!h && h.idx > 0; }
  get canRedo() { const h = this.history.get(this.page?.pageId); return !!h && h.idx < h.stack.length - 1; }

  async undo() { await this.stepHistory(-1); }
  async redo() { await this.stepHistory(1); }
  private async stepHistory(d: number) {
    const h = this.history.get(this.page.pageId);
    if (!h) return;
    const ni = h.idx + d;
    if (ni < 0 || ni >= h.stack.length) return;
    h.idx = ni;
    this.pages[this.current] = JSON.parse(h.stack[ni]);
    this.loading = true;
    this.canvas.discardActiveObject();
    await this.canvas.loadFromJSON(this.pages[this.current]);
    this.loading = false;
    this.canvas.requestRenderAll();
    this.emit();
    this.onChange?.('history');
  }

  async addPage(json?: PageJSON, at = this.current + 1) {
    this.flush();
    const page = json ? { ...json, pageId: uid() } : { version: '7', objects: [], background: '#ffffff', pageId: uid() };
    this.pages.splice(at, 0, page);
    await this.loadPage(at, true);
    this.onChange?.('pages');
  }
  async duplicatePage(i = this.current) { this.flush(); await this.addPage(structuredClone(this.pages[i]), i + 1); }
  async deletePage(i = this.current) {
    if (this.pages.length <= 1) { this.canvas.clear(); this.canvas.backgroundColor = '#ffffff'; this.commit('clear'); return; }
    this.flush();
    this.pages.splice(i, 1);
    await this.loadPage(Math.min(i, this.pages.length - 1), true);
    this.onChange?.('pages');
  }
  async movePage(from: number, to: number) {
    this.flush();
    const [p] = this.pages.splice(from, 1);
    this.pages.splice(to, 0, p);
    const curId = this.page?.pageId;
    this.current = this.pages.findIndex((x) => x.pageId === curId);
    if (this.current < 0) this.current = to;
    this.emit();
    this.onChange?.('pages');
  }

  async applyTemplate(spec: PageSpec[], srcW: number, srcH: number, mode: 'replace' | 'append' = 'replace') {
    const jsons = await Promise.all(spec.map((p) => specToJSON(p, srcW, srcH, this.width, this.height)));
    this.flush();
    if (mode === 'replace' && this.isPageEmpty()) {
      this.pages.splice(this.current, 1, ...jsons.map((j) => ({ ...j, pageId: uid() })));
    } else {
      this.pages.splice(this.current + 1, 0, ...jsons.map((j) => ({ ...j, pageId: uid() })));
      this.current++;
    }
    await this.loadPage(this.current, true);
    this.commit('template');
  }

  isPageEmpty() { return this.canvas.getObjects().length === 0; }

  // ---------- design-level ----------
  /** Replace the whole design with a newer saved copy (e.g. saved from another tab). */
  async replaceDesign(d: Design) {
    this.design = { ...d };
    this.pages = d.pages.map((p) => ({ ...p, pageId: p.pageId ?? uid() }));
    this.history.clear();
    if (this.canvas.width !== Math.round(d.width * this.zoom)) this.setZoom(this.zoom);
    await this.loadPage(Math.min(this.current, this.pages.length - 1), true);
  }

  getDesign(): Design { this.flush(); return { ...this.design, pages: this.pages }; }

  async resize(w: number, h: number, scaleContent: boolean) {
    this.flush();
    const sx = w / this.width, sy = h / this.height, s = Math.min(sx, sy);
    const ox = (w - this.width * s) / 2, oy = (h - this.height * s) / 2;
    if (scaleContent) {
      this.pages = this.pages.map((p) => ({ ...p, objects: (p.objects ?? []).map((o: any) => ({ ...o, left: o.left * s + ox, top: o.top * s + oy, scaleX: o.scaleX * s, scaleY: o.scaleY * s })) }));
    }
    this.design = { ...this.design, width: w, height: h };
    this.history.clear();
    this.canvas.setDimensions({ width: w, height: h });
    await this.loadPage(this.current, true);
    this.setZoom(this.zoom);
    this.commit('resize');
  }

  // ---------- zoom ----------
  setZoom(z: number) {
    this.zoom = Math.max(0.05, Math.min(z, 5));
    this.canvas.setZoom(this.zoom);
    this.canvas.setDimensions({ width: Math.round(this.width * this.zoom), height: Math.round(this.height * this.zoom) });
    this.emit();
  }
  fit(containerW: number, containerH: number, pad = 64) {
    const z = Math.min((containerW - pad) / this.width, (containerH - pad) / this.height);
    this.setZoom(Math.max(0.05, z));
  }

  // ---------- selection ----------
  get active(): FabricObject | undefined { return this.canvas.getActiveObject() ?? undefined; }
  get selection(): FabricObject[] { return this.canvas.getActiveObjects(); }

  get selKind(): SelKind {
    const a = this.active;
    if (!a) return 'none';
    if (a instanceof ActiveSelection) return 'multi';
    const k = (a as any).pgKind as SelKind | undefined;
    if (a instanceof Textbox) return 'text';
    if (a instanceof FabricImage) return k === 'frame' ? 'frame' : 'image';
    if (k === 'line') return 'line';
    if (k === 'graphic') return 'graphic';
    if (k === 'drawing') return 'drawing';
    if (a instanceof Group) return 'group';
    return 'shape';
  }

  select(o: FabricObject) { this.canvas.setActiveObject(o); this.canvas.requestRenderAll(); this.emit(); }
  selectAll() {
    const objs = this.canvas.getObjects().filter((o) => !(o as any).pgLocked);
    if (!objs.length) return;
    this.canvas.discardActiveObject();
    this.canvas.setActiveObject(objs.length === 1 ? objs[0] : new ActiveSelection(objs, { canvas: this.canvas }));
    this.canvas.requestRenderAll();
    this.emit();
  }
  deselect() { this.canvas.discardActiveObject(); this.canvas.requestRenderAll(); this.emit(); }

  // ---------- adding ----------
  add(o: FabricObject, opts: { center?: boolean; select?: boolean } = {}) {
    (o as any).pgId ??= uid();
    if (opts.center !== false) {
      const r = o.getBoundingRect();
      o.set({ left: o.left! + (this.width - r.width) / 2 - r.left, top: o.top! + (this.height - r.height) / 2 - r.top });
    }
    o.setCoords();
    this.canvas.add(o);
    if (opts.select !== false) this.canvas.setActiveObject(o);
    this.canvas.requestRenderAll();
    this.commit('add');
    return o;
  }

  private unit() { return Math.min(this.width, this.height); }

  async addText(kind: 'heading' | 'subheading' | 'body' | 'custom', custom?: Partial<Textbox> & { text?: string }) {
    const u = this.unit();
    const presets = {
      heading: { text: 'Add a heading', fontSize: Math.round(u * 0.08), fontWeight: 700, fontFamily: 'Inter' },
      subheading: { text: 'Add a subheading', fontSize: Math.round(u * 0.05), fontWeight: 600, fontFamily: 'Inter' },
      body: { text: 'Add a little bit of body text', fontSize: Math.round(u * 0.03), fontWeight: 400, fontFamily: 'Inter' },
      custom: {},
    } as const;
    const p = { ...presets[kind], ...custom } as any;
    await ensureFonts([p.fontFamily ?? 'Inter']);
    const t = new Textbox(p.text ?? 'Text', { width: Math.round(this.width * 0.6), fill: '#1E1B16', textAlign: 'center', lineHeight: 1.16, pgKind: 'text', pgName: 'Text', ...p } as any);
    t.set({ width: Math.min(this.width * 0.8, Math.max(t.calcTextWidth() + 20, 200)) });
    return this.add(t);
  }

  addShape(id: string, fill = '#B7410E') {
    const s = this.unit() * 0.3;
    return this.add(makeShape(id, { left: 0, top: 0, w: s, h: s, fill }));
  }

  addLine(def: LineDef) { return this.add(makeLine(def, 0, 0, this.unit() * 0.4)); }

  async addSvg(svg: string, name: string) { return this.add(await makeSvg(svg, 0, 0, this.unit() * 0.3, name)); }

  async addImage(src: string, name = 'Image') {
    const target = this.active;
    if (target instanceof FabricImage && (target as any).pgKind === 'frame') {
      await this.replaceImageSrc(target, src, true);
      return target;
    }
    const el = await loadImageEl(src);
    const maxW = this.width * 0.6, maxH = this.height * 0.6;
    const s = Math.min(maxW / el.naturalWidth, maxH / el.naturalHeight, 1);
    const img = await makeImage(src, 0, 0, el.naturalWidth * s);
    img.set({ pgName: name } as any);
    return this.add(img);
  }

  async addFrame(shape: string) {
    const s = this.unit() * 0.4;
    const ph = placeholderImage();
    const img = await makeImage(ph, 0, 0, s, s, shape);
    img.set({ pgName: 'Frame' } as any);
    return this.add(img);
  }

  addGradientRect(g: FillSpec) {
    const s = this.unit() * 0.4;
    return this.add(makeShape('square', { left: 0, top: 0, w: s, h: s, fill: toFabricFill(g, 100, 100) }));
  }

  async replaceImageSrc(img: FabricImage, src: string, cover: boolean) {
    const W = img.getScaledWidth(), H = img.getScaledHeight();
    await img.setSrc(src, { crossOrigin: 'anonymous' });
    if (cover) {
      (img as any).pgCrop = undefined;
      this.setCrop(img, 1, 0.5, 0.5, W, H);
      (img as any).pgOriginalSrc = undefined;
    }
    this.reapplyFilters(img);
    this.canvas.requestRenderAll();
    this.commit('image');
  }

  // ---------- editing ----------
  /** Set a property on every selected object (or the given one). */
  set(props: Record<string, any>, target?: FabricObject) {
    const objs = target ? [target] : this.leafSelection();
    objs.forEach((o) => {
      if (o instanceof Textbox && o.isEditing && o.selectionStart !== o.selectionEnd && TEXT_STYLE_KEYS.some((k) => k in props)) {
        o.setSelectionStyles(Object.fromEntries(Object.entries(props).filter(([k]) => TEXT_STYLE_KEYS.includes(k))));
      } else {
        o.set(props);
        if (o instanceof Textbox && TEXT_STYLE_KEYS.some((k) => k in props)) {
          // apply to whole text: also clear per-character styles for those keys
          o.removeStyle && Object.keys(props).forEach((k) => TEXT_STYLE_KEYS.includes(k) && o.removeStyle(k as any));
        }
      }
      if (o instanceof Textbox) o.initDimensions();
      o.setCoords();
      o.dirty = true;
    });
    this.active?.setCoords();
    this.canvas.requestRenderAll();
    this.commit('set');
  }

  /** Objects inside an ActiveSelection, or the selected object. Groups are treated as one. */
  leafSelection(): FabricObject[] { return this.selection; }

  async setFont(family: string) {
    await ensureFonts([family]);
    cache.clearFontCache(family);
    this.set({ fontFamily: family });
  }

  setFill(color: string | FillSpec, key: 'fill' | 'stroke' = 'fill') {
    this.leafSelection().forEach((o) => {
      if (o instanceof Group && !(o instanceof ActiveSelection)) {
        // recolour every child of a line/arrow group, keep graphics untouched
        if ((o as any).pgKind === 'line') o.getObjects().forEach((c) => c.set({ stroke: color as string }));
        o.dirty = true;
        return;
      }
      if ((o as any).pgKind === 'line' || (o as any).pgKind === 'drawing') o.set({ stroke: color as string });
      else {
        const v = typeof color === 'string' ? color : toFabricFill(color, o.width!, o.height!);
        o.set({ [key]: v });
      }
      o.dirty = true;
    });
    this.canvas.requestRenderAll();
    this.commit('color');
  }

  async setPageBackground(bg: PageSpec['bg']) {
    await setBackground(this.canvas, bg, this.width, this.height);
    this.canvas.requestRenderAll();
    this.commit('background');
  }

  remove() {
    const objs = this.selection.filter((o) => !(o as any).pgLocked);
    if (!objs.length) return;
    this.canvas.discardActiveObject();
    objs.forEach((o) => this.canvas.remove(o));
    this.canvas.requestRenderAll();
    this.commit('delete');
  }

  async copy() {
    const a = this.active;
    if (!a) return;
    this.clipboard = await a.clone(PROPS);
  }
  async cut() { await this.copy(); this.remove(); }
  async paste(offset = 24) {
    if (!this.clipboard) return;
    const cloned = await this.clipboard.clone(PROPS);
    this.canvas.discardActiveObject();
    cloned.set({ left: cloned.left! + offset, top: cloned.top! + offset, evented: true });
    if (cloned instanceof ActiveSelection) {
      cloned.canvas = this.canvas;
      cloned.forEachObject((o) => { (o as any).pgId = uid(); this.canvas.add(o); });
      cloned.setCoords();
    } else {
      (cloned as any).pgId = uid();
      this.canvas.add(cloned);
    }
    this.clipboard.set({ left: this.clipboard.left! + offset, top: this.clipboard.top! + offset });
    this.canvas.setActiveObject(cloned);
    this.canvas.requestRenderAll();
    this.commit('paste');
  }
  async duplicate() {
    const keep = this.clipboard;
    await this.copy();
    await this.paste();
    this.clipboard = keep;
  }
  hasClipboard() { return !!this.clipboard; }

  group() {
    const a = this.active;
    if (!(a instanceof ActiveSelection)) return;
    const objs = a.getObjects();
    this.canvas.discardActiveObject();
    objs.forEach((o) => this.canvas.remove(o));
    const g = new Group(objs, { pgKind: 'group', pgName: 'Group', pgId: uid() } as any);
    this.canvas.add(g);
    this.canvas.setActiveObject(g);
    this.canvas.requestRenderAll();
    this.commit('group');
  }

  ungroup() {
    const a = this.active;
    if (!(a instanceof Group) || a instanceof ActiveSelection) return;
    const idx = this.canvas.getObjects().indexOf(a);
    const objs = a.removeAll();
    this.canvas.remove(a);
    objs.forEach((o, i) => this.canvas.insertAt(idx + i, o));
    this.canvas.setActiveObject(new ActiveSelection(objs, { canvas: this.canvas }));
    this.canvas.requestRenderAll();
    this.commit('ungroup');
  }

  toggleLock(target?: FabricObject) {
    const objs = target ? [target] : this.selection;
    const lock = !objs.every((o) => (o as any).pgLocked);
    objs.forEach((o) => {
      o.set({ pgLocked: lock, lockMovementX: lock, lockMovementY: lock, lockScalingX: lock, lockScalingY: lock, lockRotation: lock, hasControls: !lock } as any);
      if (o instanceof Textbox) o.editable = !lock;
    });
    this.canvas.requestRenderAll();
    this.commit('lock');
  }
  get isLocked() { const s = this.selection; return s.length > 0 && s.every((o) => (o as any).pgLocked); }

  order(dir: 'forward' | 'backward' | 'front' | 'back', target?: FabricObject) {
    const objs = target ? [target] : this.selection;
    const c = this.canvas;
    const list = dir === 'forward' || dir === 'back' ? [...objs].reverse() : objs;
    list.forEach((o) => {
      if (dir === 'forward') c.bringObjectForward(o);
      if (dir === 'backward') c.sendObjectBackwards(o);
      if (dir === 'front') c.bringObjectToFront(o);
      if (dir === 'back') c.sendObjectToBack(o);
    });
    c.requestRenderAll();
    this.commit('order');
  }

  moveLayer(o: FabricObject, index: number) { this.canvas.moveObjectTo(o, index); this.canvas.requestRenderAll(); this.commit('order'); }

  align(where: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom') {
    const a = this.active;
    if (!a) return;
    const multi = a instanceof ActiveSelection;
    const objs = multi ? a.getObjects() : [a];
    if (multi) this.canvas.discardActiveObject();
    const rects = objs.map((o) => o.getBoundingRect());
    const box = multi
      ? { left: Math.min(...rects.map((r) => r.left)), top: Math.min(...rects.map((r) => r.top)), right: Math.max(...rects.map((r) => r.left + r.width)), bottom: Math.max(...rects.map((r) => r.top + r.height)) }
      : { left: 0, top: 0, right: this.width, bottom: this.height };
    objs.forEach((o, i) => {
      const r = rects[i];
      let dx = 0, dy = 0;
      if (where === 'left') dx = box.left - r.left;
      if (where === 'right') dx = box.right - (r.left + r.width);
      if (where === 'hcenter') dx = (box.left + box.right) / 2 - (r.left + r.width / 2);
      if (where === 'top') dy = box.top - r.top;
      if (where === 'bottom') dy = box.bottom - (r.top + r.height);
      if (where === 'vcenter') dy = (box.top + box.bottom) / 2 - (r.top + r.height / 2);
      o.set({ left: o.left! + dx, top: o.top! + dy });
      o.setCoords();
    });
    if (multi) this.canvas.setActiveObject(new ActiveSelection(objs, { canvas: this.canvas }));
    this.canvas.requestRenderAll();
    this.commit('align');
  }

  distribute(axis: 'h' | 'v') {
    const a = this.active;
    if (!(a instanceof ActiveSelection) || a.size() < 3) return;
    const objs = a.getObjects();
    this.canvas.discardActiveObject();
    const items = objs.map((o) => ({ o, r: o.getBoundingRect() })).sort((p, q) => (axis === 'h' ? p.r.left - q.r.left : p.r.top - q.r.top));
    const first = items[0].r, last = items[items.length - 1].r;
    const total = items.reduce((s, it) => s + (axis === 'h' ? it.r.width : it.r.height), 0);
    const span = axis === 'h' ? last.left + last.width - first.left : last.top + last.height - first.top;
    const gap = (span - total) / (items.length - 1);
    let pos = axis === 'h' ? first.left : first.top;
    items.forEach(({ o, r }) => {
      if (axis === 'h') o.set({ left: o.left! + (pos - r.left) }); else o.set({ top: o.top! + (pos - r.top) });
      o.setCoords();
      pos += (axis === 'h' ? r.width : r.height) + gap;
    });
    this.canvas.setActiveObject(new ActiveSelection(objs, { canvas: this.canvas }));
    this.canvas.requestRenderAll();
    this.commit('distribute');
  }

  flip(axis: 'x' | 'y') {
    this.selection.forEach((o) => o.set(axis === 'x' ? { flipX: !o.flipX } : { flipY: !o.flipY }));
    this.canvas.requestRenderAll();
    this.commit('flip');
  }

  nudge(dx: number, dy: number) {
    const a = this.active;
    if (!a || (a as any).pgLocked) return;
    a.set({ left: a.left! + dx, top: a.top! + dy });
    a.setCoords();
    this.canvas.requestRenderAll();
    this.commitDebounced();
  }
  private commitTimer?: number;
  commitDebounced(ms = 350) { clearTimeout(this.commitTimer); this.commitTimer = window.setTimeout(() => this.commit('nudge'), ms); }

  // ---------- text effects ----------
  setTextEffect(kind: 'none' | 'shadow' | 'lift' | 'outline' | 'hollow' | 'highlight' | 'neon' | 'glitch', color = '#000000') {
    this.selection.forEach((o) => {
      if (!(o instanceof Textbox)) return;
      const fs = o.fontSize!;
      const base = { shadow: null as any, stroke: undefined as any, strokeWidth: 0, textBackgroundColor: '', paintFirst: 'stroke' as const };
      const fill = (o as any).__baseFill ?? o.fill;
      const map: Record<string, any> = {
        none: { ...base, fill },
        shadow: { ...base, fill, shadow: new Shadow({ color: color + '80', blur: fs * 0.15, offsetX: fs * 0.06, offsetY: fs * 0.06 }) },
        lift: { ...base, fill, shadow: new Shadow({ color: '#00000040', blur: fs * 0.4, offsetX: 0, offsetY: fs * 0.12 }) },
        outline: { ...base, fill, stroke: color, strokeWidth: Math.max(2, fs * 0.08) },
        hollow: { ...base, fill: 'transparent', stroke: color, strokeWidth: Math.max(1.5, fs * 0.04), paintFirst: 'fill' },
        highlight: { ...base, fill, textBackgroundColor: color === '#000000' ? '#F7E27A' : color },
        neon: { ...base, fill: '#FFFFFF', shadow: new Shadow({ color: color === '#000000' ? '#FF3DCB' : color, blur: fs * 0.5, offsetX: 0, offsetY: 0 }) },
        glitch: { ...base, fill, shadow: new Shadow({ color: '#00E5FF', blur: 0, offsetX: -fs * 0.05, offsetY: 0 }), stroke: '#FF2D55', strokeWidth: fs * 0.02 },
      };
      if (kind === 'hollow' || kind === 'neon') (o as any).__baseFill = fill;
      o.set(map[kind]);
      o.dirty = true;
    });
    this.canvas.requestRenderAll();
    this.commit('effect');
  }

  // ---------- images ----------
  setAdjust(img: FabricImage, adjust: Partial<Adjust>, preset?: FilterPreset) {
    const a = { ...DEFAULT_ADJUST, ...((img as any).pgAdjust ?? {}), ...adjust };
    (img as any).pgAdjust = a;
    if (preset) (img as any).pgFilter = preset;
    this.reapplyFilters(img);
    this.canvas.requestRenderAll();
    this.commitDebounced(250);
  }

  reapplyFilters(img: FabricImage) {
    const a: Adjust = { ...DEFAULT_ADJUST, ...((img as any).pgAdjust ?? {}) };
    const p: FilterPreset = (img as any).pgFilter ?? 'None';
    img.filters = [...presetFilters(p), ...adjustFilters(a)];
    img.applyFilters();
  }

  setCrop(img: FabricImage, zoom: number, fx: number, fy: number, boxW = img.getScaledWidth(), boxH = img.getScaledHeight()) {
    const el = img.getElement() as HTMLImageElement | HTMLCanvasElement;
    const nw = (el as HTMLImageElement).naturalWidth || el.width, nh = (el as HTMLImageElement).naturalHeight || el.height;
    const s = Math.max(boxW / nw, boxH / nh) * zoom;
    const cw = boxW / s, ch = boxH / s;
    img.set({ width: cw, height: ch, cropX: (nw - cw) * fx, cropY: (nh - ch) * fy, scaleX: s * (img.scaleX! < 0 ? -1 : 1), scaleY: s, pgCrop: { zoom, fx, fy } } as any);
    applyFrame(img, (img as any).pgFrame);
    img.setCoords();
    this.canvas.requestRenderAll();
  }

  setFrame(img: FabricImage, frame: string) {
    applyFrame(img, frame);
    (img as any).pgKind = frame && frame !== 'square' ? 'frame' : (img as any).pgKind;
    this.canvas.requestRenderAll();
    this.commit('frame');
  }

  // ---------- drawing ----------
  setDrawing(on: boolean, opts: { color?: string; width?: number; kind?: 'pen' | 'marker' | 'highlighter' } = {}) {
    const c = this.canvas;
    c.isDrawingMode = on;
    if (on) {
      const b = new PencilBrush(c);
      const kind = opts.kind ?? 'pen';
      const col = opts.color ?? '#1E1B16';
      b.color = kind === 'highlighter' ? col + '66' : col;
      b.width = (opts.width ?? 8) * (kind === 'highlighter' ? 3 : 1);
      b.strokeLineCap = kind === 'highlighter' ? 'square' : 'round';
      b.decimate = 2;
      c.freeDrawingBrush = b;
      c.discardActiveObject();
    }
    this.emit();
  }

  // ---------- snapping ----------
  private snap(target: FabricObject | undefined) {
    if (!target || !this.snapping) return;
    const th = 6 / this.zoom;
    target.setCoords(); // coords are stale during a drag; measure where the object is now
    const r = target.getBoundingRect();
    const xs = [r.left, r.left + r.width / 2, r.left + r.width];
    const ys = [r.top, r.top + r.height / 2, r.top + r.height];
    const candX = [0, this.width / 2, this.width], candY = [0, this.height / 2, this.height];
    const members = target instanceof ActiveSelection ? target.getObjects() : [target];
    this.canvas.getObjects().forEach((o) => {
      if (members.includes(o) || !o.visible) return;
      const b = o.getBoundingRect();
      candX.push(b.left, b.left + b.width / 2, b.left + b.width);
      candY.push(b.top, b.top + b.height / 2, b.top + b.height);
    });
    const best = (vals: number[], cands: number[]) => {
      let bd = Infinity, delta = 0, line: number | null = null;
      vals.forEach((v) => cands.forEach((c) => { const d = Math.abs(c - v); if (d < bd && d < th) { bd = d; delta = c - v; line = c; } }));
      return { delta, line };
    };
    const bx = best(xs, candX), by = best(ys, candY);
    if (bx.line !== null) target.set({ left: target.left! + bx.delta });
    if (by.line !== null) target.set({ top: target.top! + by.delta });
    target.setCoords();
    this.guides = { v: bx.line !== null ? [bx.line] : [], h: by.line !== null ? [by.line] : [] };
  }

  private drawGuides() {
    const { v, h } = this.guides;
    if (!v.length && !h.length) return;
    const ctx = this.canvas.getContext();
    const z = this.zoom;
    ctx.save();
    ctx.setTransform(this.canvas.getRetinaScaling(), 0, 0, this.canvas.getRetinaScaling(), 0, 0);
    ctx.strokeStyle = '#E4407A';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    v.forEach((x) => { ctx.beginPath(); ctx.moveTo(x * z + 0.5, 0); ctx.lineTo(x * z + 0.5, this.height * z); ctx.stroke(); });
    h.forEach((y) => { ctx.beginPath(); ctx.moveTo(0, y * z + 0.5); ctx.lineTo(this.width * z, y * z + 0.5); ctx.stroke(); });
    ctx.restore();
  }

  /** Document colours: every solid colour used on the current page. */
  documentColors(): string[] {
    const set = new Set<string>();
    const add = (v: unknown) => { if (typeof v === 'string' && /^#|^rgb/.test(v)) set.add(v.toUpperCase()); };
    const walk = (o: FabricObject) => { add(o.fill); add(o.stroke); if (o instanceof Group) o.getObjects().forEach(walk); };
    this.canvas.getObjects().forEach(walk);
    add(this.canvas.backgroundColor);
    return [...set].slice(0, 18);
  }

  pointerInfo(e: TPointerEventInfo) { return e; }
}

const TEXT_STYLE_KEYS = ['fill', 'fontWeight', 'fontStyle', 'underline', 'linethrough', 'fontFamily', 'fontSize', 'stroke', 'strokeWidth', 'textBackgroundColor'];

function presetFilters(p: FilterPreset) {
  const f = filters;
  switch (p) {
    case 'Mono': return [new f.Grayscale()];
    case 'Noir': return [new f.Grayscale(), new f.Contrast({ contrast: 0.35 })];
    case 'Sepia': return [new f.Sepia()];
    case 'Vintage': return [new f.Vintage()];
    case 'Kodachrome': return [new f.Kodachrome()];
    case 'Technicolor': return [new f.Technicolor()];
    case 'Polaroid': return [new f.Polaroid()];
    case 'Retro': return [new f.Brownie()];
    case 'Warm': return [new f.BlendColor({ color: '#FF9A3C', mode: 'overlay', alpha: 0.35 })];
    case 'Cool': return [new f.BlendColor({ color: '#3C8DFF', mode: 'overlay', alpha: 0.3 })];
    case 'Fade': return [new f.Contrast({ contrast: -0.25 }), new f.Brightness({ brightness: 0.08 }), new f.Saturation({ saturation: -0.25 })];
    case 'Vivid': return [new f.Saturation({ saturation: 0.45 }), new f.Contrast({ contrast: 0.12 })];
    case 'Dreamy': return [new f.Brightness({ brightness: 0.06 }), new f.Blur({ blur: 0.04 }), new f.Saturation({ saturation: 0.15 })];
    default: return [];
  }
}

function adjustFilters(a: Adjust) {
  const f = filters, out: any[] = [];
  if (a.brightness) out.push(new f.Brightness({ brightness: a.brightness / 100 }));
  if (a.contrast) out.push(new f.Contrast({ contrast: a.contrast / 100 }));
  if (a.saturation) out.push(new f.Saturation({ saturation: a.saturation / 100 }));
  if (a.vibrance) out.push(new f.Vibrance({ vibrance: a.vibrance / 100 }));
  if (a.hue) out.push(new f.HueRotation({ rotation: a.hue / 180 }));
  if (a.blur) out.push(new f.Blur({ blur: a.blur / 100 }));
  if (a.noise) out.push(new f.Noise({ noise: a.noise * 3 }));
  if (a.pixelate) out.push(new f.Pixelate({ blocksize: 1 + Math.round(a.pixelate / 4) }));
  return out;
}

let ph: string | null = null;
export function placeholderImage() {
  if (ph) return ph;
  const c = document.createElement('canvas');
  c.width = c.height = 600;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 600, 600);
  g.addColorStop(0, '#E7E3DB'); g.addColorStop(1, '#CFC8BC');
  x.fillStyle = g; x.fillRect(0, 0, 600, 600);
  x.fillStyle = '#9E968A';
  x.beginPath(); x.moveTo(150, 420); x.lineTo(260, 290); x.lineTo(340, 370); x.lineTo(400, 320); x.lineTo(470, 420); x.closePath(); x.fill();
  x.beginPath(); x.arc(400, 220, 34, 0, Math.PI * 2); x.fill();
  ph = c.toDataURL('image/png');
  return ph;
}

export { util };
