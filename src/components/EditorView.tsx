import { useCallback, useEffect, useRef, useState } from 'react';
import { ActiveSelection, Textbox } from 'fabric';
import { ArrowLeft, Undo2, Redo2, Download, Maximize2, LayoutTemplate, Shapes, Type, Upload, Image as ImageIcon, PenTool, PaintBucket, Layers, Plus, Copy, Trash2, ChevronUp, ChevronDown, Keyboard, Scaling, X, Cloud, CloudOff, Magnet, Lock, ClipboardPaste, ArrowUpToLine, ArrowDownToLine, Group as GroupIcon } from 'lucide-react';
import { Editor } from '../editor/Editor';
import { loadDesign, saveDesign, StorageFullError } from '../store/db';
import { thumbnailOf } from '../editor/render';
import type { Design } from '../types';
import { useEditorVersion, ingestImage } from './hooks';
import { IconBtn, Btn, useToast, Logo } from './ui';
import { Toolbar, type ContextPanel } from './Toolbar';
import { TemplatesPanel, ElementsPanel, TextPanel, UploadsPanel, PhotosPanel, DrawPanel, BackgroundPanel, LayersPanel, ColorPanel, PhotoPanel, CropPanel, EffectsPanel } from './panels/Panels';
import { DownloadDialog, ResizeDialog, ShortcutsDialog } from './Dialogs';

const TABS = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'uploads', label: 'Uploads', icon: Upload },
  { id: 'photos', label: 'Photos', icon: ImageIcon },
  { id: 'draw', label: 'Draw', icon: PenTool },
  { id: 'background', label: 'Background', icon: PaintBucket },
  { id: 'layers', label: 'Layers', icon: Layers },
] as const;
type Tab = (typeof TABS)[number]['id'];

export function EditorView({ id }: { id: string }) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [ed, setEd] = useState<Editor | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab | null>(() => (window.innerWidth < 760 ? null : 'templates'));
  const [ctx, setCtx] = useState<ContextPanel | null>(null);
  const [dialog, setDialog] = useState<'download' | 'resize' | 'shortcuts' | null>(null);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [title, setTitle] = useState('');
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [dropping, setDropping] = useState(false);
  const toast = useToast();
  useEditorVersion(ed);

  // ---------- load ----------
  useEffect(() => {
    let editor: Editor | null = null;
    let disposed = false;
    (async () => {
      const d = await loadDesign(id);
      if (!d) { setNotFound(true); return; }
      if (disposed || !canvasEl.current) return;
      editor = new Editor(canvasEl.current, d);
      await editor.init();
      if (disposed) { editor.dispose(); return; }
      setTitle(d.title);
      document.title = `${d.title} — Pigment`;
      setEd(editor);
      requestAnimationFrame(() => { const s = stageRef.current; if (s && editor) editor.fit(s.clientWidth, s.clientHeight); });
    })();
    return () => { disposed = true; editor?.dispose(); };
  }, [id]);

  // ---------- autosave ----------
  const saveTimer = useRef<number>();
  const doSave = useCallback(async (e: Editor, titleOverride?: string) => {
    const d: Design = { ...e.getDesign(), title: titleOverride ?? e.design.title };
    e.design.title = d.title;
    try {
      const thumb = await thumbnailOf(d.pages[0], d.width, d.height, 360);
      await saveDesign(d, thumb);
      setSaveState('saved');
    } catch (err) {
      console.error(err);
      setSaveState('error');
      toast(err instanceof StorageFullError ? 'Browser storage is full. Delete old designs or uploads to keep saving.' : 'Could not save this design', 'error');
    }
  }, [toast]);

  useEffect(() => {
    if (!ed) return;
    ed.onChange = () => {
      setSaveState('saving');
      clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => doSave(ed), 700);
    };
    const beforeUnload = (e: BeforeUnloadEvent) => { if (saveState === 'saving') { e.preventDefault(); } };
    window.addEventListener('beforeunload', beforeUnload);
    return () => { window.removeEventListener('beforeunload', beforeUnload); };
  }, [ed, doSave, saveState]);

  // flush pending save on unmount
  useEffect(() => () => { if (ed && saveTimer.current) { clearTimeout(saveTimer.current); doSave(ed); } }, [ed, doSave]);

  // ---------- page thumbnails ----------
  const pagesKey = ed ? ed.pages.map((p) => p.pageId).join(',') + ':' + ed.current : '';
  const thumbTimer = useRef<number>();
  useEffect(() => {
    if (!ed) return;
    clearTimeout(thumbTimer.current);
    thumbTimer.current = window.setTimeout(async () => {
      ed.flush();
      const next: Record<string, string> = {};
      for (const p of ed.pages) {
        if (p.pageId === ed.page.pageId) next[p.pageId] = ed.canvas.toDataURL({ multiplier: 120 / Math.max(ed.width * ed.zoom, ed.height * ed.zoom) * 1, format: 'jpeg', quality: 0.7 });
        else next[p.pageId] = thumbs[p.pageId] ?? (await thumbnailOf(p, ed.width, ed.height, 160));
      }
      setThumbs(next);
    }, 400);
  }, [ed, ed?.version, pagesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- refit on resize ----------
  useEffect(() => {
    if (!ed || !stageRef.current) return;
    const ro = new ResizeObserver(() => { if (stageRef.current && (ed as any).__autoFit !== false) ed.fit(stageRef.current.clientWidth, stageRef.current.clientHeight); });
    ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, [ed]);

  // close contextual panel when selection type changes
  const selKind = ed?.selKind ?? 'none';
  useEffect(() => {
    if (!ctx) return;
    if (ctx === 'photo' || ctx === 'crop') { if (selKind !== 'image' && selKind !== 'frame') setCtx(null); }
    else if (ctx === 'effects') { if (selKind !== 'text') setCtx(null); }
    else if (typeof ctx === 'object' && ctx.color !== 'page' && selKind === 'none') setCtx(null);
  }, [selKind]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- keyboard ----------
  useEffect(() => {
    if (!ed) return;
    const onKey = async (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt.closest('input, textarea, select, [contenteditable="true"]') && !tgt.closest('.canvas-container')) return;
      if (dialog) return;
      const a = ed.active;
      const editingText = a instanceof Textbox && a.isEditing;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (editingText) {
        if (e.key === 'Escape') { a.exitEditing(); ed.canvas.requestRenderAll(); }
        if (mod && ['b', 'i', 'u'].includes(key)) {
          e.preventDefault();
          if (key === 'b') ed.set({ fontWeight: +(a.fontWeight ?? 400) >= 600 ? 400 : 700 });
          if (key === 'i') ed.set({ fontStyle: a.fontStyle === 'italic' ? 'normal' : 'italic' });
          if (key === 'u') ed.set({ underline: !a.underline });
        }
        return;
      }
      if (mod && key === 'z') { e.preventDefault(); e.shiftKey ? await ed.redo() : await ed.undo(); return; }
      if (mod && key === 'y') { e.preventDefault(); await ed.redo(); return; }
      if (mod && key === 'c') { await ed.copy(); return; }
      if (mod && key === 'x') { await ed.cut(); return; }
      if (mod && key === 'v') { if (ed.hasClipboard()) { e.preventDefault(); await ed.paste(); } return; } // otherwise let the paste event bring in images
      if (mod && key === 'd') { e.preventDefault(); await ed.duplicate(); return; }
      if (mod && key === 'a') { e.preventDefault(); ed.selectAll(); return; }
      if (mod && key === 'g') { e.preventDefault(); e.shiftKey ? ed.ungroup() : ed.group(); return; }
      if (mod && key === 'l' && e.shiftKey) { e.preventDefault(); ed.toggleLock(); return; }
      if (mod && (e.key === ']' || e.key === '}')) { e.preventDefault(); ed.order(e.shiftKey ? 'front' : 'forward'); return; }
      if (mod && (e.key === '[' || e.key === '{')) { e.preventDefault(); ed.order(e.shiftKey ? 'back' : 'backward'); return; }
      if (mod && (e.key === '=' || e.key === '+')) { e.preventDefault(); (ed as any).__autoFit = false; ed.setZoom(ed.zoom * 1.2); return; }
      if (mod && e.key === '-') { e.preventDefault(); (ed as any).__autoFit = false; ed.setZoom(ed.zoom / 1.2); return; }
      if (mod && e.key === '0') { e.preventDefault(); fit(); return; }
      if (mod && ['b', 'i', 'u'].includes(key) && a instanceof Textbox) {
        e.preventDefault();
        if (key === 'b') ed.set({ fontWeight: +(a.fontWeight ?? 400) >= 600 ? 400 : 700 });
        if (key === 'i') ed.set({ fontStyle: a.fontStyle === 'italic' ? 'normal' : 'italic' });
        if (key === 'u') ed.set({ underline: !a.underline });
        return;
      }
      if (mod) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { if (a) { e.preventDefault(); ed.remove(); } return; }
      if (e.key === 'Escape') { if (menu) setMenu(null); else if (ctx) setCtx(null); else ed.deselect(); return; }
      if (e.key.startsWith('Arrow') && a) {
        e.preventDefault();
        const s = e.shiftKey ? 10 : 1;
        ed.nudge(e.key === 'ArrowLeft' ? -s : e.key === 'ArrowRight' ? s : 0, e.key === 'ArrowUp' ? -s : e.key === 'ArrowDown' ? s : 0);
        return;
      }
      if (key === 't') { e.preventDefault(); ed.addText('heading'); }
      if (key === 'r') ed.addShape('square');
      if (key === 'c') ed.addShape('circle');
      if (key === 'l') ed.addLine({ id: 'solid', name: 'Line', width: 6 });
      if (e.key === '?') setDialog('shortcuts');
      if (e.key === 'Enter' && a instanceof Textbox) { e.preventDefault(); a.enterEditing(); a.selectAll(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ---------- paste & drop images ----------
  const addFiles = useCallback(async (files: File[]) => {
    if (!ed) return;
    for (const f of files) {
      try { const { url } = await ingestImage(f); await ed.addImage(url, f.name); window.dispatchEvent(new Event('pg-uploads')); }
      catch (e: any) { toast(e.message ?? 'Could not add that file', 'error'); }
    }
  }, [ed, toast]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt.closest('input, textarea')) return;
      const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'));
      if (files.length) { e.preventDefault(); addFiles(files); return; }
      const text = e.clipboardData?.getData('text/plain');
      if (text && ed && !(ed.active instanceof Textbox && ed.active.isEditing)) { e.preventDefault(); ed.addText('custom', { text: text.slice(0, 2000), fontSize: Math.round(Math.min(ed.width, ed.height) * 0.04) } as any); }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFiles, ed]);

  const fit = () => { if (ed && stageRef.current) { (ed as any).__autoFit = true; ed.fit(stageRef.current.clientWidth, stageRef.current.clientHeight); } };

  const openTab = (t: Tab) => { setCtx(null); setTab((cur) => (cur === t ? null : t)); };
  const openCtx = (p: ContextPanel) => { setCtx(p); };

  if (notFound) {
    return (
      <div className="center-msg">
        <Logo />
        <h1>Design not found</h1>
        <p>It may have been deleted, or it was made in a different browser. Designs are stored only on the device where they were created.</p>
        <Btn variant="primary" onClick={() => (location.hash = '/')}>Back to home</Btn>
      </div>
    );
  }

  const panel = (() => {
    if (!ed) return null;
    if (ctx) {
      if (ctx === 'photo') return <PhotoPanel ed={ed} />;
      if (ctx === 'crop') return <CropPanel ed={ed} />;
      if (ctx === 'effects') return <EffectsPanel ed={ed} />;
      if (ctx === 'position') return <LayersPanel ed={ed} />;
      return <ColorPanel key={ctx.color + (ed.active as any)?.pgId} ed={ed} target={ctx.color} />;
    }
    switch (tab) {
      case 'templates': return <TemplatesPanel ed={ed} />;
      case 'elements': return <ElementsPanel ed={ed} />;
      case 'text': return <TextPanel ed={ed} />;
      case 'uploads': return <UploadsPanel ed={ed} />;
      case 'photos': return <PhotosPanel ed={ed} />;
      case 'draw': return <DrawPanel ed={ed} />;
      case 'background': return <BackgroundPanel ed={ed} />;
      case 'layers': return <LayersPanel ed={ed} />;
      default: return null;
    }
  })();

  const commitTitle = (v: string) => { if (!ed) return; const t = v.trim() || 'Untitled design'; setTitle(t); document.title = `${t} — Pigment`; doSave(ed, t); };

  return (
    <div className="editor">
      <header className="ed-header">
        <a href="#/" className="ed-home" aria-label="Back to home"><ArrowLeft size={18} /><span className="ed-home-text">Home</span></a>
        <span className="ed-divider" />
        <IconBtn label="Undo (Ctrl+Z)" disabled={!ed?.canUndo} onClick={() => ed?.undo()} className="on-dark"><Undo2 size={18} /></IconBtn>
        <IconBtn label="Redo (Ctrl+Shift+Z)" disabled={!ed?.canRedo} onClick={() => ed?.redo()} className="on-dark"><Redo2 size={18} /></IconBtn>
        <button className="ed-hbtn" onClick={() => setDialog('resize')}><Scaling size={16} /> <span>Resize</span></button>
        <span className="ed-save" title={saveState === 'error' ? 'Not saved' : 'Saved in this browser'} aria-live="polite">
          {saveState === 'error' ? <CloudOff size={16} /> : <Cloud size={16} />}<span>{saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Not saved'}</span>
        </span>
        <input className="ed-title" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={(e) => commitTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} aria-label="Design title" />
        <span className="ed-dims">{ed ? `${ed.width} × ${ed.height} px` : ''}</span>
        <IconBtn label="Keyboard shortcuts (?)" onClick={() => setDialog('shortcuts')} className="on-dark hide-sm"><Keyboard size={18} /></IconBtn>
        <Btn variant="primary" onClick={() => setDialog('download')} disabled={!ed}><Download size={16} /> <span className="hide-xs">Download</span></Btn>
      </header>

      <div className="ed-body">
        <nav className="rail" aria-label="Tools">
          {TABS.map(({ id: t, label, icon: I }) => (
            <button key={t} className={`rail-btn ${tab === t && !ctx ? 'is-active' : ''}`} onClick={() => openTab(t)} aria-pressed={tab === t && !ctx}>
              <I size={22} aria-hidden /><span>{label}</span>
            </button>
          ))}
        </nav>

        {(ctx || tab) && (
          <aside className="panel" aria-label="Panel">
            <button className="panel-close icon-btn icon-btn-sm" aria-label="Close panel" onClick={() => { if (ctx) setCtx(null); else setTab(null); }}><X size={16} /></button>
            <div className="panel-inner">{panel}</div>
          </aside>
        )}

        <div className="workspace">
          {ed && <Toolbar ed={ed} open={openCtx} />}
          <div
            className={`stage ${dropping ? 'is-drop' : ''}`}
            ref={stageRef}
            onMouseDown={(e) => { if (e.target === e.currentTarget) ed?.deselect(); setMenu(null); }}
            onContextMenu={(e) => { e.preventDefault(); if (!ed) return; const r = stageRef.current!.getBoundingClientRect(); setMenu({ x: Math.min(e.clientX - r.left, r.width - 220), y: Math.min(e.clientY - r.top, r.height - 320) }); }}
            onWheel={(e) => { if (!ed || !(e.ctrlKey || e.metaKey)) return; e.preventDefault(); (ed as any).__autoFit = false; ed.setZoom(ed.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)); }}
            onDragOver={(e) => { if ([...e.dataTransfer.items].some((i) => i.kind === 'file')) { e.preventDefault(); setDropping(true); } }}
            onDragLeave={() => setDropping(false)}
            onDrop={(e) => { e.preventDefault(); setDropping(false); addFiles([...e.dataTransfer.files]); }}
          >
            <div className="page-frame" style={{ width: ed ? ed.width * ed.zoom : 0, height: ed ? ed.height * ed.zoom : 0 }}>
              <canvas ref={canvasEl} />
            </div>
            {!ed && <div className="stage-loading" role="status"><span className="spinner" /> Opening design…</div>}
            {dropping && <div className="drop-hint">Drop to add to your page</div>}
            {menu && ed && <ContextMenu ed={ed} pos={menu} close={() => setMenu(null)} openPosition={() => openCtx('position')} />}
          </div>

          {ed && (
            <footer className="ed-foot">
              <div className="pages" role="list" aria-label="Pages">
                {ed.pages.map((p, i) => (
                  <div key={p.pageId} role="listitem" className={`pg ${i === ed.current ? 'is-cur' : ''}`}>
                    <button className="pg-thumb" onClick={() => ed.loadPage(i)} aria-label={`Page ${i + 1}`} aria-current={i === ed.current}
                      style={{ aspectRatio: `${ed.width}/${ed.height}` }}>
                      {thumbs[p.pageId] ? <img src={thumbs[p.pageId]} alt="" /> : null}
                      <span className="pg-n">{i + 1}</span>
                    </button>
                    {i === ed.current && (
                      <div className="pg-actions">
                        <IconBtn label="Move page left" disabled={i === 0} onClick={() => ed.movePage(i, i - 1)} className="icon-btn-sm"><ChevronUp size={12} style={{ transform: 'rotate(-90deg)' }} /></IconBtn>
                        <IconBtn label="Duplicate page" onClick={() => ed.duplicatePage(i)} className="icon-btn-sm"><Copy size={12} /></IconBtn>
                        <IconBtn label="Delete page" onClick={() => { if (ed.pages.length === 1 || confirm(`Delete page ${i + 1}?`)) ed.deletePage(i); }} className="icon-btn-sm"><Trash2 size={12} /></IconBtn>
                        <IconBtn label="Move page right" disabled={i === ed.pages.length - 1} onClick={() => ed.movePage(i, i + 1)} className="icon-btn-sm"><ChevronDown size={12} style={{ transform: 'rotate(-90deg)' }} /></IconBtn>
                      </div>
                    )}
                  </div>
                ))}
                <button className="pg-add" onClick={() => ed.addPage()} aria-label="Add page" style={{ aspectRatio: `${ed.width}/${ed.height}` }}><Plus size={18} /></button>
              </div>
              <div className="zoom">
                <IconBtn label={ed.snapping ? 'Snapping on' : 'Snapping off'} active={ed.snapping} onClick={() => { ed.snapping = !ed.snapping; ed.emit(); }} className="icon-btn-sm"><Magnet size={14} /></IconBtn>
                <span className="hint hide-sm">Page {ed.current + 1} / {ed.pages.length}</span>
                <input type="range" min={5} max={300} value={Math.round(ed.zoom * 100)} onChange={(e) => { (ed as any).__autoFit = false; ed.setZoom(+e.target.value / 100); }} aria-label="Zoom" className="hide-sm" />
                <button className="zoom-val" onClick={fit} title="Fit to screen (Ctrl+0)">{Math.round(ed.zoom * 100)}%</button>
                <IconBtn label="Fit to screen" onClick={fit} className="icon-btn-sm"><Maximize2 size={14} /></IconBtn>
              </div>
            </footer>
          )}
        </div>
      </div>

      {dialog === 'download' && ed && <DownloadDialog ed={ed} onClose={() => setDialog(null)} />}
      {dialog === 'resize' && ed && <ResizeDialog ed={ed} onClose={() => setDialog(null)} />}
      {dialog === 'shortcuts' && <ShortcutsDialog onClose={() => setDialog(null)} />}
    </div>
  );
}

function ContextMenu({ ed, pos, close, openPosition }: { ed: Editor; pos: { x: number; y: number }; close: () => void; openPosition: () => void }) {
  const a = ed.active;
  const run = (fn: () => unknown) => async () => { await fn(); close(); };
  return (
    <div className="menu ctx-menu" role="menu" style={{ left: pos.x, top: pos.y }} onMouseDown={(e) => e.stopPropagation()}>
      {a ? (
        <>
          <button role="menuitem" onClick={run(() => ed.copy())}><Copy size={14} /> Copy <kbd>Ctrl C</kbd></button>
          <button role="menuitem" disabled={!ed.hasClipboard()} onClick={run(() => ed.paste())}><ClipboardPaste size={14} /> Paste <kbd>Ctrl V</kbd></button>
          <button role="menuitem" onClick={run(() => ed.duplicate())}><Copy size={14} /> Duplicate <kbd>Ctrl D</kbd></button>
          <button role="menuitem" onClick={run(() => ed.remove())} className="danger"><Trash2 size={14} /> Delete <kbd>Del</kbd></button>
          <hr />
          <button role="menuitem" onClick={run(() => ed.order('front'))}><ArrowUpToLine size={14} /> Bring to front</button>
          <button role="menuitem" onClick={run(() => ed.order('back'))}><ArrowDownToLine size={14} /> Send to back</button>
          {a instanceof ActiveSelection && <button role="menuitem" onClick={run(() => ed.group())}><GroupIcon size={14} /> Group <kbd>Ctrl G</kbd></button>}
          {ed.selKind === 'group' && <button role="menuitem" onClick={run(() => ed.ungroup())}><GroupIcon size={14} /> Ungroup</button>}
          <button role="menuitem" onClick={run(() => ed.toggleLock())}><Lock size={14} /> {ed.isLocked ? 'Unlock' : 'Lock'}</button>
          <button role="menuitem" onClick={run(openPosition)}><Layers size={14} /> Position & layers</button>
        </>
      ) : (
        <>
          <button role="menuitem" disabled={!ed.hasClipboard()} onClick={run(() => ed.paste())}><ClipboardPaste size={14} /> Paste</button>
          <button role="menuitem" onClick={run(() => ed.selectAll())}>Select all <kbd>Ctrl A</kbd></button>
          <button role="menuitem" onClick={run(() => ed.addPage())}><Plus size={14} /> Add page</button>
          <button role="menuitem" onClick={run(() => ed.duplicatePage())}><Copy size={14} /> Duplicate page</button>
          <button role="menuitem" className="danger" onClick={run(() => ed.deletePage())}><Trash2 size={14} /> Delete page</button>
        </>
      )}
    </div>
  );
}
