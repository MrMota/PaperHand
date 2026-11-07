import { Textbox } from 'fabric';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, CaseUpper, Sparkles, Copy, Trash2, Lock, Unlock, Group, Ungroup, FlipHorizontal2, FlipVertical2, Crop, Wand2, Layers, Minus, Plus, Strikethrough, List } from 'lucide-react';
import type { Editor } from '../editor/Editor';
import { FONTS } from '../fonts';
import { IconBtn } from './ui';
import type { ColorTarget } from './panels/Panels';

export type ContextPanel = 'photo' | 'crop' | 'effects' | 'position' | { color: ColorTarget };

function Swatch({ color, label, onClick, ring }: { color: any; label: string; onClick: () => void; ring?: boolean }) {
  const bg = typeof color === 'string' ? (color || 'transparent') : 'conic-gradient(#E4572E, #F2B632, #3BB273, #2E8BC0, #9C6ADE, #E4572E)';
  return (
    <button className={`tb-swatch ${ring ? 'tb-swatch-ring' : ''}`} aria-label={label} title={label} onClick={onClick}>
      <span style={{ background: bg }} />
    </button>
  );
}

export function Toolbar({ ed, open, setOpen }: { ed: Editor; open: (p: ContextPanel) => void; setOpen?: never }) {
  void setOpen;
  const k = ed.selKind;
  const a = ed.active;
  const locked = ed.isLocked;
  if (k === 'none') {
    return (
      <div className="toolbar" role="toolbar" aria-label="Page tools">
        <Swatch color={ed.canvas.backgroundColor} label="Page background colour" onClick={() => open({ color: 'page' })} />
        <span className="tb-hint">Click anything to edit it · Drop photos straight onto the page</span>
      </div>
    );
  }
  const t = a instanceof Textbox ? a : null;
  const opacity = Math.round((a?.opacity ?? 1) * 100);
  return (
    <div className="toolbar" role="toolbar" aria-label="Element tools">
      {t && !locked && (
        <>
          <select className="tb-font" aria-label="Font" value={t.fontFamily} onChange={(e) => ed.setFont(e.target.value)} style={{ fontFamily: t.fontFamily }}>
            {FONTS.map((f) => <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>{f.family}</option>)}
          </select>
          <div className="tb-size">
            <IconBtn label="Decrease font size" onClick={() => ed.set({ fontSize: Math.max(4, Math.round(t.fontSize! * 0.9)) })}><Minus size={14} /></IconBtn>
            <input aria-label="Font size" type="number" value={Math.round(t.fontSize! * (t.scaleY ?? 1))} onChange={(e) => { const v = +e.target.value; if (v > 0) ed.set({ fontSize: v / (t.scaleY ?? 1) }); }} />
            <IconBtn label="Increase font size" onClick={() => ed.set({ fontSize: Math.round(t.fontSize! * 1.1) + 1 })}><Plus size={14} /></IconBtn>
          </div>
          <button className="tb-text-color" aria-label="Text colour" title="Text colour" onClick={() => open({ color: 'fill' })}>
            <span className="tb-a">A</span><span className="tb-bar" style={{ background: typeof t.fill === 'string' ? t.fill : '#000' }} />
          </button>
          <span className="tb-sep" />
          <IconBtn label="Bold (Ctrl+B)" active={+(t.fontWeight ?? 400) >= 600 || t.fontWeight === 'bold'} onClick={() => ed.set({ fontWeight: +(t.fontWeight ?? 400) >= 600 || t.fontWeight === 'bold' ? 400 : 700 })}><Bold size={16} /></IconBtn>
          <IconBtn label="Italic (Ctrl+I)" active={t.fontStyle === 'italic'} onClick={() => ed.set({ fontStyle: t.fontStyle === 'italic' ? 'normal' : 'italic' })}><Italic size={16} /></IconBtn>
          <IconBtn label="Underline (Ctrl+U)" active={!!t.underline} onClick={() => ed.set({ underline: !t.underline })}><Underline size={16} /></IconBtn>
          <IconBtn label="Strikethrough" active={!!t.linethrough} onClick={() => ed.set({ linethrough: !t.linethrough })}><Strikethrough size={16} /></IconBtn>
          <IconBtn label={`Align: ${t.textAlign}`} onClick={() => ed.set({ textAlign: ({ left: 'center', center: 'right', right: 'justify', justify: 'left' } as any)[t.textAlign ?? 'left'] })}>
            {t.textAlign === 'center' ? <AlignCenter size={16} /> : t.textAlign === 'right' ? <AlignRight size={16} /> : t.textAlign === 'justify' ? <AlignJustify size={16} /> : <AlignLeft size={16} />}
          </IconBtn>
          <IconBtn label="Bulleted list" onClick={() => {
            const lines = t.text!.split('\n'); const on = lines.every((l) => l.startsWith('• '));
            ed.set({ text: lines.map((l) => (on ? l.replace(/^• /, '') : `• ${l}`)).join('\n') });
          }}><List size={16} /></IconBtn>
          <IconBtn label="Uppercase / lowercase" active={t.text === t.text!.toUpperCase()} onClick={() => ed.set({ text: t.text === t.text!.toUpperCase() ? t.text!.toLowerCase().replace(/(^|[.!?]\s+|\n)([a-z])/g, (_m, p, c) => p + c.toUpperCase()) : t.text!.toUpperCase() })}><CaseUpper size={16} /></IconBtn>
          <button className="tb-btn" onClick={() => open('effects')}><Sparkles size={15} /> Effects</button>
          <span className="tb-sep" />
        </>
      )}
      {(k === 'shape' || k === 'graphic') && !locked && (
        <>
          {k === 'shape' && <Swatch color={a?.fill} label="Fill colour" onClick={() => open({ color: 'fill' })} />}
          {k === 'shape' && <Swatch color={a?.stroke ?? ''} label="Border colour" ring onClick={() => open({ color: 'stroke' })} />}
          {k === 'shape' && (
            <label className="tb-num" title="Border width"><span>Border</span>
              <input type="number" min={0} max={200} value={Math.round(a?.strokeWidth ?? 0)} onChange={(e) => ed.set({ strokeWidth: +e.target.value, stroke: a?.stroke || '#1E1B16', strokeUniform: true })} />
            </label>
          )}
          {k === 'shape' && a?.type === 'rect' && (
            <label className="tb-num" title="Corner rounding"><span>Corners</span>
              <input type="number" min={0} max={500} value={Math.round((a as any).rx ?? 0)} onChange={(e) => ed.set({ rx: +e.target.value, ry: +e.target.value })} />
            </label>
          )}
          <span className="tb-sep" />
        </>
      )}
      {(k === 'line' || k === 'drawing') && !locked && (
        <>
          <Swatch color={k === 'line' && (a as any).getObjects ? (a as any).getObjects()[0]?.stroke : a?.stroke} label="Line colour" onClick={() => open({ color: 'fill' })} />
          {k === 'line' && a?.type === 'line' && (
            <>
              <label className="tb-num" title="Line weight"><span>Weight</span><input type="number" min={1} max={100} value={Math.round(a.strokeWidth ?? 1)} onChange={(e) => ed.set({ strokeWidth: +e.target.value })} /></label>
              <select className="tb-select" aria-label="Line style" value={JSON.stringify(a.strokeDashArray ?? null)} onChange={(e) => ed.set({ strokeDashArray: JSON.parse(e.target.value) })}>
                <option value="null">Solid</option><option value="[24,14]">Dashed</option><option value="[0,18]">Dotted</option>
              </select>
            </>
          )}
          <span className="tb-sep" />
        </>
      )}
      {(k === 'image' || k === 'frame') && !locked && (
        <>
          <button className="tb-btn tb-btn-accent" onClick={() => open('photo')}><Wand2 size={15} /> Edit photo</button>
          <button className="tb-btn" onClick={() => open('crop')}><Crop size={15} /> Crop</button>
          <IconBtn label="Flip horizontal" onClick={() => ed.flip('x')}><FlipHorizontal2 size={16} /></IconBtn>
          <IconBtn label="Flip vertical" onClick={() => ed.flip('y')}><FlipVertical2 size={16} /></IconBtn>
          <span className="tb-sep" />
        </>
      )}
      {k === 'multi' && !locked && <button className="tb-btn" onClick={() => ed.group()}><Group size={15} /> Group</button>}
      {k === 'group' && !locked && <button className="tb-btn" onClick={() => ed.ungroup()}><Ungroup size={15} /> Ungroup</button>}

      <div className="tb-right">
        {!locked && (
          <label className="tb-opacity" title="Transparency">
            <span className="sr-only">Transparency</span>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><rect width="8" height="8" fill="currentColor" /><rect x="8" y="8" width="8" height="8" fill="currentColor" /><rect x="8" width="8" height="8" fill="currentColor" opacity=".3" /><rect y="8" width="8" height="8" fill="currentColor" opacity=".3" /></svg>
            <input type="range" min={0} max={100} value={opacity} onChange={(e) => { ed.selection.forEach((o) => o.set({ opacity: +e.target.value / 100 })); ed.canvas.requestRenderAll(); ed.commitDebounced(); ed.emit(); }} aria-label="Transparency" />
            <span className="tb-opv">{opacity}</span>
          </label>
        )}
        <button className="tb-btn" onClick={() => open('position')}><Layers size={15} /> Position</button>
        <IconBtn label={locked ? 'Unlock' : 'Lock'} active={locked} onClick={() => ed.toggleLock()}>{locked ? <Lock size={16} /> : <Unlock size={16} />}</IconBtn>
        {!locked && <IconBtn label="Duplicate (Ctrl+D)" onClick={() => ed.duplicate()}><Copy size={16} /></IconBtn>}
        {!locked && <IconBtn label="Delete (Del)" onClick={() => ed.remove()}><Trash2 size={16} /></IconBtn>}
      </div>
    </div>
  );
}
