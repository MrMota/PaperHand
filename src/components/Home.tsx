import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, LayoutTemplate, MoreHorizontal, Pencil, Plus, Ruler, Trash2, Sparkles, Image as ImageIcon, Type, Wand2, FileDown, FolderOpen, Archive } from 'lucide-react';
import { backupEverything, deleteEverything, downloadDesignFile, importFile } from '../store/backup';
import { loadDesign } from '../store/db';
import { LegalFooter } from './Legal';
import { canInstall, promptInstall } from '../platform/pwa';
import { isDesktop, isNative } from '../platform/native';
import { Download as DownloadIcon } from 'lucide-react';
import { Btn, Chips, Logo, Modal, Search, useToast } from './ui';
import { TemplateCard } from './TemplateCard';
import { FORMATS, TEMPLATES, TEMPLATE_CATEGORIES, type Template } from '../content/templates';
import { createDesign, deleteDesign, duplicateDesign, listDesigns, renameDesign } from '../store/db';
import { specToJSON } from '../editor/render';
import type { DesignMeta } from '../types';
import { uid } from '../types';
import { go } from '../App';

export async function startFromTemplate(t: Template) {
  const pages = await Promise.all(t.pages.map((p) => specToJSON(p, t.w, t.h)));
  const d = await createDesign({ title: t.title, width: t.w, height: t.h, pages: pages.map((p) => ({ ...p, pageId: uid() })) });
  go(`/design/${d.id}`);
}

const FORMAT_ICONS: Record<string, string> = { square: '1:1', story: '9:16', presentation: '16:9', poster: 'A4', flyer: 'Ltr', thumbnail: '16:9', banner: '~3:1', card: '7:4', logo: '1:1', invitation: '5×7', resume: 'A4', certificate: '√2', wide: '16:9', portrait: '4:5' };

export function Home({ view, initialCat }: { view: 'home' | 'templates'; initialCat?: string }) {
  const [designs, setDesigns] = useState<DesignMeta[] | null>(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(initialCat && TEMPLATE_CATEGORIES.includes(initialCat) ? initialCat : 'All');
  const [custom, setCustom] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const refresh = () => listDesigns().then(setDesigns);
  useEffect(() => { refresh(); document.title = isDesktop() ? 'Paperhand' : 'Paperhand — design by hand, in your browser'; }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return TEMPLATES.filter((t) => (cat === 'All' || t.category === cat) && (!s || `${t.title} ${t.category} ${t.tags}`.toLowerCase().includes(s)));
  }, [q, cat]);

  const pick = async (t: Template) => {
    if (busy) return;
    setBusy(true);
    try { await startFromTemplate(t); } catch (e) { console.error(e); toast('Could not open that template', 'error'); setBusy(false); }
  };

  const blank = async (w: number, h: number, title = 'Untitled design') => {
    const d = await createDesign({ width: w, height: h, title });
    go(`/design/${d.id}`);
  };

  const showAll = view === 'templates';

  return (
    <div className="home">
      <header className="home-top">
        <a href="#/" className="home-brand" aria-label="Paperhand home"><Logo /></a>
        <nav className="home-nav" aria-label="Main">
          <a href="#/" aria-current={!showAll ? 'page' : undefined}>Home</a>
          <a href="#/templates" aria-current={showAll ? 'page' : undefined}>Templates</a>
          <a href="#/about">About</a>
        </nav>
        <InstallButton />
        <Btn variant="primary" onClick={() => setCustom(true)}><Plus size={16} /> New design</Btn>
      </header>

      <main className="home-main">
        {!showAll && (
          <section className="hero" aria-labelledby="hero-h">
            <h1 id="hero-h">Make something by hand.</h1>
            <p className="hero-sub">Templates, photos and type. No account, no AI filler, nothing locked.</p>
            <div className="hero-search"><Search value={q} onChange={(v) => { setQ(v); }} placeholder="Search templates — try “poster”, “sale” or “resume”" /></div>
            <ul className="hero-points">
              <li><LayoutTemplate size={16} /> {TEMPLATES.length} templates</li>
              <li><Sparkles size={16} /> 100+ hand-drawn elements</li>
              <li><Wand2 size={16} /> On-device background removal</li>
              <li><Type size={16} /> 18 fonts</li>
              <li><ImageIcon size={16} /> PNG · JPG · PDF · SVG</li>
            </ul>
          </section>
        )}

        {!showAll && !q && (
          <section aria-labelledby="sizes-h" className="section">
            <div className="section-head"><h2 id="sizes-h">Start with a size</h2></div>
            <div className="sizes">
              <button className="size-card size-custom" onClick={() => setCustom(true)}>
                <span className="size-icon" aria-hidden><Ruler size={22} /></span>
                <span className="size-name">Custom size</span>
                <span className="size-dim">Any width × height</span>
              </button>
              {FORMATS.map((f) => (
                <button key={f.id} className="size-card" onClick={() => blank(f.w, f.h, f.name)}>
                  <span className="size-icon" aria-hidden><span className="size-shape" style={{ aspectRatio: `${f.w}/${f.h}` }}>{FORMAT_ICONS[f.id]}</span></span>
                  <span className="size-name">{f.name}</span>
                  <span className="size-dim">{f.w} × {f.h} px</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {!showAll && !q && (
          <section aria-labelledby="recent-h" className="section">
            <div className="section-head"><h2 id="recent-h">Recent designs</h2><DataActions count={designs?.length ?? 0} onChange={refresh} /></div>
            {designs === null ? (
              <div className="grid-designs">{[0, 1, 2].map((i) => <div key={i} className="dcard"><span className="dcard-thumb"><span className="skeleton" /></span></div>)}</div>
            ) : designs.length === 0 ? (
              <div className="empty">
                <p><strong>Your designs will live here.</strong> Start one from a size or a template; it saves itself as you go.</p>
              </div>
            ) : (
              <div className="grid-designs">
                {designs.map((d) => <DesignCard key={d.id} d={d} onChange={refresh} />)}
              </div>
            )}
          </section>
        )}

        <section aria-labelledby="tpl-h" className="section">
          <div className="section-head">
            <h2 id="tpl-h">{q ? `Templates matching “${q}”` : showAll ? 'All templates' : 'Templates'}</h2>
            {!showAll && !q && <a href="#/templates" className="link">See all</a>}
          </div>
          {showAll && <div className="tpl-search"><Search value={q} onChange={setQ} placeholder="Search templates" /></div>}
          {(showAll || q) && <Chips items={TEMPLATE_CATEGORIES} value={cat} onChange={(c) => setCat(c)} />}
          {filtered.length === 0 ? (
            <div className="empty"><p>Nothing for <strong>“{q}”</strong>{cat !== 'All' ? ` in ${cat}` : ''}. Try a shorter word, or <button className="link" onClick={() => { setQ(''); setCat('All'); }}>clear the filters</button>.</p></div>
          ) : (
            <div className="grid-templates" aria-busy={busy}>
              {(showAll || q ? filtered : filtered.slice(0, 12)).map((t) => <TemplateCard key={t.id} t={t} onPick={pick} />)}
            </div>
          )}
        </section>
      </main>

      <LegalFooter />

      {custom && <CustomSize onClose={() => setCustom(false)} onCreate={(w, h) => blank(w, h)} />}
    </div>
  );
}

function DesignCard({ d, onChange }: { d: DesignMeta; onChange: () => void }) {
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const toast = useToast();
  const ago = timeAgo(d.updatedAt);
  return (
    <div className="dcard">
      <a href={`#/design/${d.id}`} className="dcard-link">
        <span className="dcard-thumb" style={{ aspectRatio: `${d.width} / ${d.height}` }}>{d.thumb ? <img src={d.thumb} alt="" /> : <span className="dcard-blank" />}</span>
        <span className="dcard-title">{d.title}</span>
        <span className="dcard-sub">{d.width} × {d.height} · edited {ago}</span>
      </a>
      <div className="dcard-menu">
        <button className="icon-btn icon-btn-sm" aria-label={`Options for ${d.title}`} aria-expanded={menu} onClick={() => setMenu((m) => !m)}><MoreHorizontal size={16} /></button>
        {menu && (
          <div className="menu" role="menu" onMouseLeave={() => setMenu(false)}>
            <button role="menuitem" onClick={() => { setMenu(false); setRenaming(true); }}><Pencil size={14} /> Rename</button>
            <button role="menuitem" onClick={async () => { await duplicateDesign(d.id); onChange(); setMenu(false); toast('Design duplicated', 'success'); }}><Copy size={14} /> Make a copy</button>
            <button role="menuitem" onClick={async () => { const full = await loadDesign(d.id); if (full) downloadDesignFile(full); setMenu(false); }}><FileDown size={14} /> Download design file</button>
            <button role="menuitem" className="danger" onClick={async () => { if (confirm(`Delete “${d.title}”? This cannot be undone.`)) { await deleteDesign(d.id); onChange(); } setMenu(false); }}><Trash2 size={14} /> Delete</button>
          </div>
        )}
      </div>
      {renaming && <RenameDialog title={d.title} onClose={() => setRenaming(false)} onSave={async (t) => { await renameDesign(d.id, t); onChange(); }} />}
    </div>
  );
}

function RenameDialog({ title, onClose, onSave }: { title: string; onClose: () => void; onSave: (t: string) => Promise<void> }) {
  const [value, setValue] = useState(title);
  const clean = value.trim();
  return (
    <Modal title="Rename design" onClose={onClose}>
      <form className="form" onSubmit={async (e) => { e.preventDefault(); if (!clean) return; await onSave(clean.slice(0, 200)); onClose(); }}>
        <label className="field"><span>Name</span><input value={value} onChange={(e) => setValue(e.target.value)} maxLength={200} autoFocus onFocus={(e) => e.target.select()} /></label>
        <Btn variant="primary" type="submit" className="btn-block" disabled={!clean}>Save name</Btn>
      </form>
    </Modal>
  );
}

function InstallButton() {
  const [ok, setOk] = useState(canInstall());
  useEffect(() => { const on = () => setOk(canInstall()); window.addEventListener('pg-installable', on); return () => window.removeEventListener('pg-installable', on); }, []);
  if (!ok) return null;
  return <Btn variant="secondary" onClick={promptInstall}><DownloadIcon size={16} /> <span className="hide-xs">Install app</span></Btn>;
}

function DataActions({ count, onChange }: { count: number; onChange: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const open = async (files: FileList | null) => {
    for (const f of [...(files ?? [])]) {
      try {
        const r = await importFile(f);
        onChange();
        toast(r.designs === 1 && !r.uploads ? `Opened “${f.name}”` : `Added ${r.designs} design${r.designs === 1 ? '' : 's'}${r.uploads ? ` and ${r.uploads} upload${r.uploads === 1 ? '' : 's'}` : ''}`, 'success');
      } catch (e: any) { toast(e.message ?? 'Couldn’t open that file', 'error'); }
    }
  };
  return (
    <div className="data-actions">
      <button className="link" onClick={() => input.current?.click()}><FolderOpen size={14} /> Open a design file</button>
      <input ref={input} type="file" accept={isNative() ? undefined : '.paperhand,application/json'} multiple hidden onChange={(e) => { open(e.target.files); e.target.value = ''; }} aria-label="Open a design file" />
      {count > 0 && <button className="link" onClick={async () => { const r = await backupEverything(); toast(`Backed up ${r.designs} design${r.designs === 1 ? '' : 's'} and ${r.uploads} upload${r.uploads === 1 ? '' : 's'}`, 'success'); }}><Archive size={14} /> Back up everything</button>}
      {count > 0 && <button className="link link-danger" onClick={async () => {
        if (!confirm('Delete every design and upload in this browser? This can’t be undone. Back up first if you want to keep anything.')) return;
        await deleteEverything(); onChange(); toast('Everything in this browser was deleted');
      }}><Trash2 size={14} /> Delete everything</button>}
    </div>
  );
}

function timeAgo(t: number) {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(t).toLocaleDateString();
}

const UNITS = { px: 1, in: 96, mm: 96 / 25.4, cm: 96 / 2.54 } as const;

export function CustomSize({ onClose, onCreate, initial, title = 'Custom size', cta = 'Start designing', extra }: { onClose: () => void; onCreate: (w: number, h: number) => void; initial?: [number, number]; title?: string; cta?: string; extra?: React.ReactNode }) {
  const [unit, setUnit] = useState<keyof typeof UNITS>('px');
  const [w, setW] = useState(String(initial?.[0] ?? 1080));
  const [h, setH] = useState(String(initial?.[1] ?? 1080));
  const pw = Math.round(+w * UNITS[unit]), ph = Math.round(+h * UNITS[unit]);
  const err = !(pw >= 40 && ph >= 40) ? 'Each side needs to be at least 40 px.' : pw > 8000 || ph > 8000 ? 'Keep each side under 8000 px.' : '';
  const changeUnit = (u: keyof typeof UNITS) => {
    setW(String(+((+w * UNITS[unit]) / UNITS[u]).toFixed(2)));
    setH(String(+((+h * UNITS[unit]) / UNITS[u]).toFixed(2)));
    setUnit(u);
  };
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); if (!err) { onCreate(pw, ph); onClose(); } }} className="form">
        <div className="row-3">
          <label className="field"><span>Width</span><input inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} aria-invalid={!!err} /></label>
          <label className="field"><span>Height</span><input inputMode="decimal" value={h} onChange={(e) => setH(e.target.value)} aria-invalid={!!err} /></label>
          <label className="field"><span>Unit</span>
            <select value={unit} onChange={(e) => changeUnit(e.target.value as any)}>{Object.keys(UNITS).map((u) => <option key={u}>{u}</option>)}</select>
          </label>
        </div>
        <div className="preset-row">
          {FORMATS.slice(0, 8).map((f) => <button type="button" className="chip" key={f.id} onClick={() => { setUnit('px'); setW(String(f.w)); setH(String(f.h)); }}>{f.name}</button>)}
        </div>
        {extra}
        {err ? <p className="field-error" role="alert">{err}</p> : <p className="hint">{pw} × {ph} px</p>}
        <Btn variant="primary" type="submit" disabled={!!err} className="btn-block">{cta}</Btn>
      </form>
    </Modal>
  );
}
