import { useEffect, useMemo, useRef, useState } from 'react';
import { FabricImage, Textbox, type FabricObject } from 'fabric';
import { Eye, EyeOff, Lock, Unlock, Trash2, Upload, Pipette, Wand2, Undo2, AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, Pen, Highlighter, Brush, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Type as TypeIcon, Square, Image as ImageIcon, Shapes, PenLine, Group as GroupIcon, AlignHorizontalSpaceAround, AlignVerticalSpaceAround } from 'lucide-react';
import type { Editor, FilterPreset } from '../../editor/Editor';
import { DEFAULT_ADJUST, FILTER_PRESETS } from '../../editor/Editor';
import { Btn, Chips, Search, Slider, useToast } from '../ui';
import { TemplateCard } from '../TemplateCard';
import { TEMPLATES, TEMPLATE_CATEGORIES, type Template } from '../../content/templates';
import { SHAPES, LINES, FRAMES } from '../../content/shapes';
import { STICKERS } from '../../content/stickers';
import { GRADIENTS, SWATCHES, type FillSpec, type GradientSpec } from '../../content/palette';
import { GEN_IMAGES, genImage } from '../../content/generated';
import { deleteUpload, getUpload, listUploads } from '../../store/db';
import { ingestImage } from '../hooks';
import { removeBackground, type BgMode } from '../../bg/removeBackground';
import type { UploadMeta } from '../../types';

const gradCss = (g: GradientSpec) => g.type === 'radial'
  ? `radial-gradient(circle, ${g.stops.map(([o, c]) => `${c} ${o * 100}%`).join(', ')})`
  : `linear-gradient(${g.angle ?? 180}deg, ${g.stops.map(([o, c]) => `${c} ${o * 100}%`).join(', ')})`;

function PanelHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return <div className="panel-head"><h2>{title}</h2>{children}</div>;
}

// ---------------- Templates ----------------
export function TemplatesPanel({ ed }: { ed: Editor }) {
  const [q, setQ] = useState('');
  const ratio = ed.width / ed.height;
  const [cat, setCat] = useState('Matching size');
  const toast = useToast();
  const cats = ['Matching size', ...TEMPLATE_CATEGORIES];
  const list = useMemo(() => {
    const s = q.toLowerCase();
    return TEMPLATES.filter((t) => {
      if (cat === 'Matching size' && Math.abs(t.w / t.h - ratio) > 0.08) return false;
      if (cat !== 'Matching size' && cat !== 'All' && t.category !== cat) return false;
      return !s || `${t.title} ${t.tags} ${t.category}`.toLowerCase().includes(s);
    });
  }, [q, cat, ratio]);
  const apply = async (t: Template) => {
    await ed.applyTemplate(t.pages, t.w, t.h);
    toast(ed.pages.length > 1 && t.pages.length === 1 ? `Added “${t.title}”` : `Applied “${t.title}”`, 'success');
  };
  return (
    <>
      <PanelHead title="Templates" />
      <Search value={q} onChange={setQ} placeholder="Search templates" />
      <div className="chips-scroll"><Chips items={cats} value={cat} onChange={setCat} /></div>
      <p className="hint">Applies to the current page if it is empty, otherwise adds new pages. Templates are scaled to fit your size.</p>
      {list.length === 0 ? <div className="empty small"><p>No templates here. Try “All”.</p></div> : (
        <div className="panel-grid-2">{list.map((t) => <TemplateCard key={t.id} t={t} onPick={apply} compact />)}</div>
      )}
    </>
  );
}

// ---------------- Elements ----------------
function shapeSvg(d: string, fill = 'currentColor') {
  return <svg viewBox="-2 -2 104 104" aria-hidden><path d={d} fill={fill} fillRule="evenodd" /></svg>;
}

export function ElementsPanel({ ed }: { ed: Editor }) {
  const [q, setQ] = useState('');
  const [more, setMore] = useState<string | null>(null);
  const s = q.trim().toLowerCase();
  const m = (t: string) => !s || t.toLowerCase().includes(s);
  const shapes = SHAPES.filter((x) => m(`${x.name} ${x.tags} shape`));
  const stickers = STICKERS.filter((x) => m(`${x.name} ${x.tags} graphic sticker illustration`));
  const lines = LINES.filter((x) => m(`${x.name} line arrow`));
  const frames = FRAMES.filter((x) => m(`${x.name} frame photo mask`));
  const grads = GRADIENTS.filter((x) => m(`${x.name} gradient`));
  const Section = ({ id, title, count, children }: { id: string; title: string; count: number; children: React.ReactNode }) => count === 0 ? null : (
    <section className="psec">
      <div className="psec-head"><h3>{title}</h3>{!s && !more && count > 8 && <button className="link" onClick={() => setMore(id)}>See all</button>}</div>
      {children}
    </section>
  );
  const lim = (n: number, id: string) => (s || more === id ? Infinity : n);
  const nothing = !shapes.length && !stickers.length && !lines.length && !frames.length && !grads.length;
  return (
    <>
      <PanelHead title="Elements">{more && <button className="link" onClick={() => setMore(null)}>← Back</button>}</PanelHead>
      <Search value={q} onChange={setQ} placeholder="Search shapes, graphics, frames…" />
      {nothing && <div className="empty small"><p>Nothing matches “{q}”.</p></div>}
      {(!more || more === 'lines') && <Section id="lines" title="Lines & arrows" count={lines.length}>
        <div className="el-grid">{lines.slice(0, lim(8, 'lines')).map((l) => (
          <button key={l.id} className="el" title={l.name} aria-label={`Add ${l.name}`} onClick={() => ed.addLine(l)}>
            <svg viewBox="0 0 100 40" aria-hidden><line x1={l.arrowStart ? 14 : 8} y1="20" x2={l.arrowEnd ? 86 : 92} y2="20" stroke="currentColor" strokeWidth={l.width / 1.5} strokeDasharray={l.dash?.map((d) => d / 2).join(' ')} strokeLinecap={l.cap ?? 'round'} />{l.arrowEnd && <path d="M80 10 L94 20 L80 30" stroke="currentColor" strokeWidth="4" fill="none" />}{l.arrowStart && <path d="M20 10 L6 20 L20 30" stroke="currentColor" strokeWidth="4" fill="none" />}</svg>
          </button>
        ))}</div>
      </Section>}
      {(!more || more === 'shapes') && <Section id="shapes" title="Shapes" count={shapes.length}>
        <div className="el-grid">{shapes.slice(0, lim(12, 'shapes')).map((x) => (
          <button key={x.id} className="el el-shape" title={x.name} aria-label={`Add ${x.name}`} onClick={() => ed.addShape(x.id)}>{shapeSvg(x.d)}</button>
        ))}</div>
      </Section>}
      {(!more || more === 'graphics') && <Section id="graphics" title="Graphics" count={stickers.length}>
        <div className="el-grid">{stickers.slice(0, lim(12, 'graphics')).map((x) => (
          <button key={x.id} className="el" title={x.name} aria-label={`Add ${x.name}`} onClick={() => ed.addSvg(x.svg, x.name)}><img src={`data:image/svg+xml;utf8,${encodeURIComponent(x.svg)}`} alt="" /></button>
        ))}</div>
      </Section>}
      {(!more || more === 'frames') && <Section id="frames" title="Frames" count={frames.length}>
        <p className="hint">Add a frame, then click a photo or upload while it is selected to fill it.</p>
        <div className="el-grid">{frames.slice(0, lim(8, 'frames')).map((x) => (
          <button key={x.id} className="el el-frame" title={`${x.name} frame`} aria-label={`Add ${x.name} frame`} onClick={() => ed.addFrame(x.id)}>{shapeSvg(x.d, 'var(--frame-fill)')}</button>
        ))}</div>
      </Section>}
      {(!more || more === 'gradients') && <Section id="gradients" title="Gradients" count={grads.length}>
        <div className="el-grid">{grads.slice(0, lim(8, 'gradients')).map((x) => (
          <button key={x.id} className="el el-grad" title={x.name} aria-label={`Add ${x.name} gradient`} style={{ background: gradCss(x.g) }} onClick={() => ed.addGradientRect(x.g)} />
        ))}</div>
      </Section>}
    </>
  );
}

// ---------------- Text ----------------
const COMBOS: { label: string; parts: { text: string; font: string; size: number; weight?: number; color?: string; ls?: number; italic?: boolean }[] }[] = [
  { label: 'Editorial', parts: [{ text: 'The Quiet Issue', font: 'DM Serif Display', size: 1 }, { text: 'STORIES FROM SLOW PLACES', font: 'Inter', size: 0.28, weight: 600, ls: 300 }] },
  { label: 'Bold sale', parts: [{ text: 'BIG SALE', font: 'Anton', size: 1.2, color: '#E4572E' }, { text: 'up to 50% off everything', font: 'Poppins', size: 0.3 }] },
  { label: 'Elegant', parts: [{ text: 'Save the date', font: 'Pacifico', size: 0.9, color: '#B7410E' }, { text: 'JUNE 14 · 2026', font: 'Raleway', size: 0.3, ls: 400 }] },
  { label: 'Tech', parts: [{ text: 'build.ship.repeat', font: 'Space Grotesk', size: 0.8, weight: 700 }, { text: '// release notes v2.0', font: 'Roboto Mono', size: 0.3, color: '#2E8BC0' }] },
  { label: 'Poster', parts: [{ text: 'NIGHT MARKET', font: 'Bebas Neue', size: 1.3 }, { text: 'Fridays from 6pm', font: 'Montserrat', size: 0.32, weight: 700 }] },
  { label: 'Handwritten', parts: [{ text: 'hello, sunshine', font: 'Caveat', size: 1, weight: 700, color: '#E4577A' }] },
  { label: 'Classic', parts: [{ text: 'Grand Opening', font: 'Playfair Display', size: 0.9, weight: 700 }, { text: 'a new chapter begins', font: 'Lora', size: 0.34, italic: true }] },
  { label: 'Retro', parts: [{ text: 'Groovy', font: 'Lobster', size: 1.1, color: '#F28C28' }, { text: 'VIBES ONLY', font: 'Archivo Black', size: 0.34, color: '#9A360B' }] },
  { label: 'Statement', parts: [{ text: 'Less, but better.', font: 'Abril Fatface', size: 0.9 }] },
  { label: 'Clean', parts: [{ text: 'Weekly Report', font: 'Montserrat', size: 0.8, weight: 900 }, { text: 'Numbers, notes and next steps', font: 'Inter', size: 0.3, color: '#5E5850' }] },
];

export function TextPanel({ ed }: { ed: Editor }) {
  const addCombo = async (c: (typeof COMBOS)[number]) => {
    const base = Math.min(ed.width, ed.height) * 0.1;
    let y = 0;
    const objs: FabricObject[] = [];
    for (const p of c.parts) {
      const t = await ed.addText('custom', { text: p.text, fontFamily: p.font, fontSize: Math.round(base * p.size), fontWeight: (p.weight ?? 400) as any, fill: p.color ?? '#1E1B16', charSpacing: p.ls ?? 0, fontStyle: p.italic ? 'italic' : 'normal' } as any);
      objs.push(t);
    }
    // stack vertically around the centre
    const total = objs.reduce((s, o) => s + o.getScaledHeight() + base * 0.15, 0);
    y = (ed.height - total) / 2;
    objs.forEach((o) => { o.set({ top: y }); o.setCoords(); y += o.getScaledHeight() + base * 0.15; });
    if (objs.length > 1) { ed.selectAll(); const sel = ed.active; if (sel) { ed.canvas.discardActiveObject(); } ed.canvas.setActiveObject(objs[0]); }
    ed.canvas.requestRenderAll();
    ed.commit('combo');
  };
  return (
    <>
      <PanelHead title="Text" />
      <Btn variant="primary" className="btn-block" onClick={() => ed.addText('heading')}><TypeIcon size={16} /> Add a text box</Btn>
      <div className="text-adds">
        <button className="text-add t-h" onClick={() => ed.addText('heading')}>Add a heading</button>
        <button className="text-add t-s" onClick={() => ed.addText('subheading')}>Add a subheading</button>
        <button className="text-add t-b" onClick={() => ed.addText('body')}>Add a little bit of body text</button>
      </div>
      <section className="psec">
        <div className="psec-head"><h3>Font combinations</h3></div>
        <div className="combo-grid">
          {COMBOS.map((c) => (
            <button key={c.label} className="combo" onClick={() => addCombo(c)} aria-label={`Add ${c.label} text combination`}>
              {c.parts.map((p, i) => <span key={i} style={{ fontFamily: p.font, fontSize: i === 0 ? 22 * Math.min(p.size, 1.1) : 10, fontWeight: p.weight, color: p.color, letterSpacing: p.ls ? p.ls / 1000 + 'em' : undefined, fontStyle: p.italic ? 'italic' : undefined }}>{p.text}</span>)}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

// ---------------- Uploads ----------------
export function UploadsPanel({ ed }: { ed: Editor }) {
  const [items, setItems] = useState<UploadMeta[] | null>(null);
  const [busy, setBusy] = useState(0);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const refresh = () => listUploads().then(setItems);
  useEffect(() => { refresh(); const on = () => refresh(); window.addEventListener('pg-uploads', on); return () => window.removeEventListener('pg-uploads', on); }, []);
  const handle = async (files: FileList | File[]) => {
    const arr = [...files];
    setBusy((b) => b + arr.length);
    for (const f of arr) {
      try { await ingestImage(f); } catch (e: any) { toast(e.message ?? 'Upload failed', 'error'); }
      setBusy((b) => b - 1);
      refresh();
    }
  };
  const add = async (u: UploadMeta) => { const src = await getUpload(u.id); if (src) await ed.addImage(src, u.name); };
  return (
    <>
      <PanelHead title="Uploads" />
      <div className={`dropzone ${drag ? 'is-drag' : ''}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}>
        <Upload size={22} aria-hidden />
        <p>Drop images here</p>
        <Btn variant="primary" onClick={() => input.current?.click()}>Upload files</Btn>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) handle(e.target.files); e.target.value = ''; }} />
        <p className="hint">PNG, JPG, WEBP, GIF or SVG up to 25 MB. Stored only in this browser.</p>
      </div>
      {busy > 0 && <p className="hint" role="status"><span className="spinner" /> Processing {busy} file{busy > 1 ? 's' : ''}…</p>}
      {items && items.length === 0 && !busy && <div className="empty small"><p>Your uploads will appear here. You can also drag images straight onto the page or paste them.</p></div>}
      <div className="up-grid">
        {items?.map((u) => (
          <div key={u.id} className="up">
            <button className="up-btn" onClick={() => add(u)} title={u.name} aria-label={`Add ${u.name}`}><img src={u.thumb} alt="" /></button>
            <button className="up-del icon-btn icon-btn-sm" aria-label={`Delete ${u.name}`} onClick={async () => { await deleteUpload(u.id); refresh(); }}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </>
  );
}

// ---------------- Photos (generated) ----------------
export function PhotosPanel({ ed }: { ed: Editor }) {
  const [q, setQ] = useState('');
  const list = GEN_IMAGES.filter((g) => !q || `${g.name} ${g.tags}`.toLowerCase().includes(q.toLowerCase()));
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  useEffect(() => {
    let i = 0, alive = true;
    const next = () => { if (!alive || i >= GEN_IMAGES.length) return; const g = GEN_IMAGES[i++]; setThumbs((t) => ({ ...t, [g.id]: genImage(g.id, 300, 225) })); setTimeout(next, 0); };
    next();
    return () => { alive = false; };
  }, []);
  return (
    <>
      <PanelHead title="Photos & textures" />
      <Search value={q} onChange={setQ} placeholder="Search images" />
      <p className="hint">Original artwork generated on your device. Click to add, or use as a page background from the Background tab.</p>
      {list.length === 0 && <div className="empty small"><p>No images match “{q}”.</p></div>}
      <div className="up-grid">
        {list.map((g) => (
          <button key={g.id} className="up-btn" title={g.name} aria-label={`Add ${g.name}`} onClick={() => ed.addImage(genImage(g.id, 1600, 1200), g.name)}>
            {thumbs[g.id] ? <img src={thumbs[g.id]} alt="" /> : <span className="skeleton" />}
          </button>
        ))}
      </div>
    </>
  );
}

// ---------------- Draw ----------------
export function DrawPanel({ ed }: { ed: Editor }) {
  const [kind, setKind] = useState<'pen' | 'marker' | 'highlighter'>('pen');
  const [color, setColor] = useState('#1E1B16');
  const [width, setWidth] = useState(8);
  useEffect(() => { ed.setDrawing(true, { kind, color, width: kind === 'marker' ? width * 2 : width }); }, [ed, kind, color, width]);
  useEffect(() => () => ed.setDrawing(false), [ed]);
  return (
    <>
      <PanelHead title="Draw" />
      <div className="seg" role="radiogroup" aria-label="Brush">
        {([['pen', Pen, 'Pen'], ['marker', Brush, 'Marker'], ['highlighter', Highlighter, 'Highlighter']] as const).map(([k, I, l]) => (
          <button key={k} role="radio" aria-checked={kind === k} className={kind === k ? 'is-on' : ''} onClick={() => setKind(k)}><I size={18} /> {l}</button>
        ))}
      </div>
      <Slider label="Size" value={width} min={1} max={60} onChange={setWidth} />
      <div className="swatches">{SWATCHES.map((c) => <button key={c} className={`sw ${c === color ? 'is-on' : ''}`} style={{ background: c }} aria-label={`Colour ${c}`} onClick={() => setColor(c)} />)}</div>
      <label className="field"><span>Custom colour</span><input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>
      <p className="hint">Draw directly on the page. Each stroke becomes its own element you can move, recolour or delete. Close this panel to stop drawing.</p>
    </>
  );
}

// ---------------- Background ----------------
export function BackgroundPanel({ ed }: { ed: Editor }) {
  const [custom, setCustom] = useState('#ffffff');
  return (
    <>
      <PanelHead title="Background" />
      <section className="psec"><div className="psec-head"><h3>Colour</h3></div>
        <div className="swatches">{SWATCHES.map((c) => <button key={c} className="sw" style={{ background: c }} aria-label={`Background ${c}`} onClick={() => ed.setPageBackground(c)} />)}</div>
        <label className="field row"><span>Custom</span><input type="color" value={custom} onChange={(e) => { setCustom(e.target.value); ed.setPageBackground(e.target.value); }} /></label>
      </section>
      <section className="psec"><div className="psec-head"><h3>Gradients</h3></div>
        <div className="el-grid">{GRADIENTS.map((g) => <button key={g.id} className="el el-grad" title={g.name} aria-label={`${g.name} background`} style={{ background: gradCss(g.g) }} onClick={() => ed.setPageBackground(g.g)} />)}</div>
      </section>
      <section className="psec"><div className="psec-head"><h3>Images & textures</h3></div>
        <div className="up-grid">{GEN_IMAGES.map((g) => <button key={g.id} className="up-btn" title={g.name} aria-label={`${g.name} background`} onClick={() => ed.setPageBackground({ image: `gen:${g.id}` })}><img src={genImage(g.id, 300, 225)} alt="" /></button>)}</div>
      </section>
    </>
  );
}

// ---------------- Layers / Position ----------------
const kindIcon = (o: FabricObject) => o instanceof Textbox ? TypeIcon : o instanceof FabricImage ? ImageIcon : (o as any).pgKind === 'line' ? PenLine : (o as any).pgKind === 'group' ? GroupIcon : (o as any).pgKind === 'graphic' ? Shapes : Square;

export function LayersPanel({ ed }: { ed: Editor }) {
  const objs = ed.canvas.getObjects().slice().reverse();
  const sel = ed.selection;
  const a = ed.active;
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const r = a ? { x: Math.round(a.left!), y: Math.round(a.top!), w: Math.round(a.getScaledWidth()), h: Math.round(a.getScaledHeight()), angle: Math.round(a.angle ?? 0) } : null;
  const setNum = (k: 'x' | 'y' | 'w' | 'h' | 'angle', v: number) => {
    if (!a || Number.isNaN(v)) return;
    if (k === 'x') a.set({ left: v });
    if (k === 'y') a.set({ top: v });
    if (k === 'w') a.set({ scaleX: v / a.width! });
    if (k === 'h') a.set({ scaleY: v / a.height! });
    if (k === 'angle') a.rotate(v);
    a.setCoords(); ed.canvas.requestRenderAll(); ed.commitDebounced();
  };
  return (
    <>
      <PanelHead title="Position" />
      {a ? (
        <>
          <section className="psec"><div className="psec-head"><h3>Arrange</h3></div>
            <div className="btn-grid-2">
              <Btn size="sm" onClick={() => ed.order('forward')}><ArrowUp size={14} /> Forward</Btn>
              <Btn size="sm" onClick={() => ed.order('backward')}><ArrowDown size={14} /> Backward</Btn>
              <Btn size="sm" onClick={() => ed.order('front')}><ChevronsUp size={14} /> To front</Btn>
              <Btn size="sm" onClick={() => ed.order('back')}><ChevronsDown size={14} /> To back</Btn>
            </div>
          </section>
          <section className="psec"><div className="psec-head"><h3>Align {sel.length > 1 ? 'to selection' : 'to page'}</h3></div>
            <div className="btn-grid-3">
              <Btn size="sm" onClick={() => ed.align('top')}><AlignStartHorizontal size={14} /> Top</Btn>
              <Btn size="sm" onClick={() => ed.align('left')}><AlignStartVertical size={14} /> Left</Btn>
              <Btn size="sm" onClick={() => ed.align('vcenter')}><AlignCenterHorizontal size={14} /> Middle</Btn>
              <Btn size="sm" onClick={() => ed.align('hcenter')}><AlignCenterVertical size={14} /> Centre</Btn>
              <Btn size="sm" onClick={() => ed.align('bottom')}><AlignEndHorizontal size={14} /> Bottom</Btn>
              <Btn size="sm" onClick={() => ed.align('right')}><AlignEndVertical size={14} /> Right</Btn>
            </div>
            {sel.length > 2 && <div className="btn-grid-2" style={{ marginTop: 8 }}>
              <Btn size="sm" onClick={() => ed.distribute('h')}><AlignHorizontalSpaceAround size={14} /> Space horizontally</Btn>
              <Btn size="sm" onClick={() => ed.distribute('v')}><AlignVerticalSpaceAround size={14} /> Space vertically</Btn>
            </div>}
          </section>
          {r && sel.length === 1 && (
            <section className="psec"><div className="psec-head"><h3>Size & position</h3></div>
              <div className="num-grid">
                {(['w', 'h', 'x', 'y', 'angle'] as const).map((k) => (
                  <label key={k} className="field"><span>{{ w: 'Width', h: 'Height', x: 'X', y: 'Y', angle: 'Rotate °' }[k]}</span><input type="number" value={r[k]} onChange={(e) => setNum(k, +e.target.value)} /></label>
                ))}
              </div>
            </section>
          )}
        </>
      ) : <p className="hint">Select an element to arrange or align it.</p>}
      <section className="psec"><div className="psec-head"><h3>Layers</h3><span className="hint">Top to bottom · drag to reorder</span></div>
        {objs.length === 0 ? <div className="empty small"><p>This page is empty.</p></div> : (
          <ul className="layers">
            {objs.map((o, i) => {
              const I = kindIcon(o);
              const name = (o as any).pgName ?? o.type;
              const label = o instanceof Textbox ? o.text!.slice(0, 28) : name;
              return (
                <li key={(o as any).pgId ?? i} className={`layer ${sel.includes(o) ? 'is-sel' : ''}`} draggable
                  onDragStart={() => setDragIdx(i)} onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (dragIdx === null) return; const from = objs[dragIdx]; ed.moveLayer(from, objs.length - 1 - i); setDragIdx(null); }}>
                  <button className="layer-main" onClick={() => ed.select(o)}><I size={14} aria-hidden /> <span>{label}</span></button>
                  <button className="icon-btn icon-btn-sm" aria-label={o.visible ? `Hide ${label}` : `Show ${label}`} onClick={() => { o.visible = !o.visible; ed.canvas.requestRenderAll(); ed.commit('visible'); }}>{o.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                  <button className="icon-btn icon-btn-sm" aria-label={(o as any).pgLocked ? `Unlock ${label}` : `Lock ${label}`} onClick={() => ed.toggleLock(o)}>{(o as any).pgLocked ? <Lock size={14} /> : <Unlock size={14} />}</button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

// ---------------- Colour ----------------
export type ColorTarget = 'fill' | 'stroke' | 'textbg' | 'page';
export function ColorPanel({ ed, target }: { ed: Editor; target: ColorTarget }) {
  const docColors = ed.documentColors();
  const a = ed.active;
  const current = target === 'textbg' ? (a as any)?.textBackgroundColor : target === 'stroke' ? a?.stroke : target === 'page' ? ed.canvas.backgroundColor : a?.fill;
  const [hex, setHex] = useState(typeof current === 'string' && current.startsWith('#') ? current : '#000000');
  const apply = (c: string | FillSpec) => {
    if (target === 'page') return ed.setPageBackground(c);
    if (target === 'textbg') return ed.set({ textBackgroundColor: c });
    ed.setFill(c, target === 'stroke' ? 'stroke' : 'fill');
  };
  const eyedrop = async () => {
    try { const r = await new (window as any).EyeDropper().open(); setHex(r.sRGBHex); apply(r.sRGBHex); } catch { /* cancelled */ }
  };
  const title = { fill: 'Colour', stroke: 'Border colour', textbg: 'Highlight colour', page: 'Background colour' }[target];
  return (
    <>
      <PanelHead title={title} />
      <div className="color-custom">
        <input type="color" value={hex} onChange={(e) => { setHex(e.target.value); apply(e.target.value); }} aria-label="Pick a colour" />
        <input className="hex" value={hex} onChange={(e) => { setHex(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) apply(e.target.value); }} aria-label="Hex colour" />
        {'EyeDropper' in window && <button className="icon-btn" aria-label="Pick colour from screen" title="Eyedropper" onClick={eyedrop}><Pipette size={16} /></button>}
        {target === 'textbg' && <Btn size="sm" variant="ghost" onClick={() => apply('')}>None</Btn>}
      </div>
      {docColors.length > 0 && <section className="psec"><div className="psec-head"><h3>Document colours</h3></div>
        <div className="swatches">{docColors.map((c) => <button key={c} className="sw" style={{ background: c }} aria-label={`Colour ${c}`} onClick={() => { setHex(c); apply(c); }} />)}</div>
      </section>}
      <section className="psec"><div className="psec-head"><h3>Default colours</h3></div>
        <div className="swatches">{SWATCHES.map((c) => <button key={c} className="sw" style={{ background: c }} aria-label={`Colour ${c}`} onClick={() => { setHex(c); apply(c); }} />)}</div>
      </section>
      {(target === 'fill' || target === 'page') && ed.selKind !== 'text' && (
        <section className="psec"><div className="psec-head"><h3>Gradients</h3></div>
          <div className="swatches">{GRADIENTS.map((g) => <button key={g.id} className="sw" style={{ background: gradCss(g.g) }} aria-label={`${g.name} gradient`} onClick={() => apply(g.g)} />)}</div>
        </section>
      )}
    </>
  );
}

// ---------------- Photo edit (filters, adjust, BG removal) ----------------
export function PhotoPanel({ ed }: { ed: Editor }) {
  const img = ed.active instanceof FabricImage ? ed.active : null;
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [mode, setMode] = useState<BgMode>('object');
  const [tab, setTab] = useState<'Effects' | 'Filters' | 'Adjust'>('Effects');
  const [thumb, setThumb] = useState('');
  const adj = { ...DEFAULT_ADJUST, ...((img as any)?.pgAdjust ?? {}) };
  const preset: FilterPreset = (img as any)?.pgFilter ?? 'None';
  useEffect(() => {
    if (!img) return;
    const el = (img as any)._originalElement ?? img.getElement();
    const c = document.createElement('canvas');
    const s = 80 / Math.max(el.width, el.height);
    c.width = Math.round(el.width * s); c.height = Math.round(el.height * s);
    c.getContext('2d')!.drawImage(el, 0, 0, c.width, c.height);
    setThumb(c.toDataURL());
  }, [img, (img as any)?.pgOriginalSrc]);
  if (!img) return <><PanelHead title="Edit photo" /><p className="hint">Select a photo to edit it.</p></>;
  const hasCut = !!(img as any).pgOriginalSrc;
  const runBg = async () => {
    const src = (img as any).pgOriginalSrc ?? img.getSrc();
    setBusy('Starting…');
    const t0 = performance.now();
    const res = await removeBackground(src, mode, (p) => setBusy(p.phase === 'download' ? `Downloading model${p.pct != null ? ` ${Math.round(p.pct)}%` : '…'} (first time only)` : p.phase === 'running' ? 'Finding the subject…' : 'Finishing edges…'));
    (img as any).pgOriginalSrc = src;
    await img.setSrc(res.url);
    ed.reapplyFilters(img);
    ed.canvas.requestRenderAll();
    ed.commit('bg-remove');
    setBusy(null);
    if (res.usedFallback) toast('The AI model could not load (offline?). Used colour-based removal instead.', 'error');
    else toast(`Background removed in ${((performance.now() - t0) / 1000).toFixed(1)} s`, 'success');
  };
  const restore = async () => {
    const orig = (img as any).pgOriginalSrc;
    if (!orig) return;
    await img.setSrc(orig);
    (img as any).pgOriginalSrc = undefined;
    ed.reapplyFilters(img);
    ed.canvas.requestRenderAll();
    ed.commit('bg-restore');
  };
  return (
    <>
      <PanelHead title="Edit photo" />
      <Chips items={['Effects', 'Filters', 'Adjust'] as const} value={tab} onChange={setTab} />
      {tab === 'Effects' && (
        <>
          <section className="psec bg-card">
            <div className="psec-head"><h3><Wand2 size={16} /> Background remover</h3></div>
            <p className="hint">Runs on your device. Nothing is uploaded. The first run downloads a model and caches it.</p>
            <label className="field"><span>Method</span>
              <select value={mode} onChange={(e) => setMode(e.target.value as BgMode)} disabled={!!busy}>
                <option value="object">Any subject — best quality (AI, ~110 MB once)</option>
                <option value="portrait">People — fast (AI, ~25 MB once)</option>
                <option value="color">Plain backgrounds — instant, works offline</option>
              </select>
            </label>
            <Btn variant="primary" className="btn-block" onClick={runBg} loading={!!busy}>{busy ?? (hasCut ? 'Remove again' : 'Remove background')}</Btn>
            {hasCut && !busy && <Btn variant="ghost" className="btn-block" onClick={restore}><Undo2 size={14} /> Restore original</Btn>}
          </section>
          <section className="psec"><div className="psec-head"><h3>Shadow</h3></div>
            <div className="btn-grid-3">
              <Btn size="sm" onClick={() => ed.set({ shadow: null })}>None</Btn>
              <Btn size="sm" onClick={() => ed.set({ shadow: { color: '#00000059', blur: 30, offsetX: 0, offsetY: 16 } as any })}>Drop</Btn>
              <Btn size="sm" onClick={() => ed.set({ shadow: { color: '#FFFFFFCC', blur: 40, offsetX: 0, offsetY: 0 } as any })}>Glow</Btn>
            </div>
          </section>
        </>
      )}
      {tab === 'Filters' && (
        <div className="filter-grid">
          {FILTER_PRESETS.map((p) => (
            <button key={p} className={`filter ${p === preset ? 'is-on' : ''}`} onClick={() => ed.setAdjust(img, {}, p)} aria-pressed={p === preset}>
              <span className="filter-thumb" style={{ backgroundImage: `url(${thumb})`, filter: CSS_FILTERS[p] }} />
              <span>{p}</span>
            </button>
          ))}
        </div>
      )}
      {tab === 'Adjust' && (
        <div className="adjust">
          {([['brightness', 'Brightness', -100, 100], ['contrast', 'Contrast', -100, 100], ['saturation', 'Saturation', -100, 100], ['vibrance', 'Vibrance', -100, 100], ['hue', 'Hue', -180, 180], ['blur', 'Blur', 0, 100], ['noise', 'Grain', 0, 100], ['pixelate', 'Pixelate', 0, 100]] as const).map(([k, l, mn, mx]) => (
            <Slider key={k} label={l} min={mn} max={mx} value={adj[k]} onChange={(v) => ed.setAdjust(img, { [k]: v })} />
          ))}
          <Btn size="sm" variant="ghost" onClick={() => ed.setAdjust(img, { ...DEFAULT_ADJUST })}>Reset adjustments</Btn>
        </div>
      )}
    </>
  );
}

const CSS_FILTERS: Record<FilterPreset, string> = {
  None: 'none', Mono: 'grayscale(1)', Noir: 'grayscale(1) contrast(1.4)', Sepia: 'sepia(1)', Vintage: 'sepia(.5) contrast(1.1) saturate(1.2)', Kodachrome: 'saturate(1.4) contrast(1.15)',
  Technicolor: 'saturate(1.6) hue-rotate(-8deg)', Polaroid: 'contrast(1.1) brightness(1.05) saturate(1.2)', Retro: 'sepia(.7) saturate(1.3)', Warm: 'sepia(.25) saturate(1.3)', Cool: 'hue-rotate(15deg) saturate(1.1)',
  Fade: 'contrast(.8) brightness(1.08) saturate(.75)', Vivid: 'saturate(1.5) contrast(1.1)', Dreamy: 'brightness(1.06) blur(.6px) saturate(1.15)',
};

// ---------------- Crop & frame ----------------
export function CropPanel({ ed }: { ed: Editor }) {
  const img = ed.active instanceof FabricImage ? ed.active : null;
  const crop = (img as any)?.pgCrop ?? { zoom: 1, fx: 0.5, fy: 0.5 };
  const [st, setSt] = useState(crop);
  const box = useRef<[number, number] | null>(null);
  useEffect(() => { if (img) box.current = [img.getScaledWidth(), img.getScaledHeight()]; setSt((img as any)?.pgCrop ?? { zoom: 1, fx: 0.5, fy: 0.5 }); }, [img]);
  if (!img) return <><PanelHead title="Crop" /><p className="hint">Select a photo to crop it.</p></>;
  const upd = (p: Partial<typeof st>) => { const n = { ...st, ...p }; setSt(n); ed.setCrop(img, n.zoom, n.fx, n.fy, box.current?.[0], box.current?.[1]); ed.commitDebounced(); };
  return (
    <>
      <PanelHead title="Crop & frame" />
      <Slider label="Zoom" min={1} max={4} step={0.01} value={st.zoom} onChange={(v) => upd({ zoom: v })} format={(v) => `${v.toFixed(2)}×`} />
      <Slider label="Horizontal" min={0} max={1} step={0.01} value={st.fx} onChange={(v) => upd({ fx: v })} format={(v) => `${Math.round(v * 100)}%`} />
      <Slider label="Vertical" min={0} max={1} step={0.01} value={st.fy} onChange={(v) => upd({ fy: v })} format={(v) => `${Math.round(v * 100)}%`} />
      <section className="psec"><div className="psec-head"><h3>Aspect</h3></div>
        <div className="btn-grid-3">
          {([['Square', 1], ['4:5', 0.8], ['16:9', 16 / 9], ['3:2', 1.5], ['9:16', 9 / 16], ['Original', 0]] as const).map(([l, r]) => (
            <Btn key={l} size="sm" onClick={() => {
              const el = img.getElement() as HTMLImageElement; const nat = (el.naturalWidth || el.width) / (el.naturalHeight || el.height);
              const ratio = r || nat; const w = box.current![0]; box.current = [w, w / ratio]; upd({});
            }}>{l}</Btn>
          ))}
        </div>
      </section>
      <section className="psec"><div className="psec-head"><h3>Frame shape</h3></div>
        <div className="el-grid">{FRAMES.map((f) => (
          <button key={f.id} className={`el el-frame ${((img as any).pgFrame ?? 'square') === f.id ? 'is-on' : ''}`} aria-label={`${f.name} frame`} title={f.name} onClick={() => ed.setFrame(img, f.id)}>{shapeSvg(f.d, 'var(--frame-fill)')}</button>
        ))}</div>
      </section>
      <Btn size="sm" variant="ghost" onClick={() => upd({ zoom: 1, fx: 0.5, fy: 0.5 })}>Reset crop</Btn>
    </>
  );
}

// ---------------- Text effects ----------------
export function EffectsPanel({ ed }: { ed: Editor }) {
  const [color, setColor] = useState('#000000');
  const t = ed.active instanceof Textbox ? ed.active : null;
  const effects = [['none', 'None'], ['shadow', 'Shadow'], ['lift', 'Lift'], ['outline', 'Outline'], ['hollow', 'Hollow'], ['highlight', 'Highlight'], ['neon', 'Neon'], ['glitch', 'Glitch']] as const;
  return (
    <>
      <PanelHead title="Text effects" />
      {!t && <p className="hint">Select text to add effects.</p>}
      <div className="fx-grid">
        {effects.map(([k, l]) => (
          <button key={k} className={`fx fx-${k}`} disabled={!t} onClick={() => ed.setTextEffect(k, color)}><span className="fx-sample">Ag</span><span>{l}</span></button>
        ))}
      </div>
      <label className="field row"><span>Effect colour</span><input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>
      {t && (
        <section className="psec"><div className="psec-head"><h3>Spacing</h3></div>
          <Slider label="Letter spacing" min={-100} max={800} value={t.charSpacing ?? 0} onChange={(v) => ed.set({ charSpacing: v })} />
          <Slider label="Line height" min={0.6} max={3} step={0.02} value={t.lineHeight ?? 1.16} onChange={(v) => ed.set({ lineHeight: v })} format={(v) => v.toFixed(2)} />
        </section>
      )}
    </>
  );
}
