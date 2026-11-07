import { useState } from 'react';
import { Download } from 'lucide-react';
import type { Editor } from '../editor/Editor';
import { exportDesign, type ExportFormat } from '../editor/export';
import { Btn, Modal, useToast } from './ui';
import { CustomSize } from './Home';
import { FORMATS } from '../content/templates';

export function DownloadDialog({ ed, onClose }: { ed: Editor; onClose: () => void }) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [mult, setMult] = useState(1);
  const [transparent, setTransparent] = useState(false);
  const [which, setWhich] = useState<'all' | 'current'>('all');
  const [quality, setQuality] = useState(0.92);
  const [progress, setProgress] = useState<string | null>(null);
  const toast = useToast();
  const n = ed.pages.length;
  const go = async () => {
    setProgress('Preparing…');
    try {
      const d = ed.getDesign();
      await exportDesign(d, { format, multiplier: mult, transparent, pages: which === 'current' ? [ed.current] : [], quality }, (a, b) => setProgress(`Rendering page ${a} of ${b}…`));
      toast('Download ready', 'success');
      onClose();
    } catch (e) {
      console.error(e);
      toast('Export failed. Try a smaller size.', 'error');
      setProgress(null);
    }
  };
  const px = `${Math.round(ed.width * mult)} × ${Math.round(ed.height * mult)} px`;
  return (
    <Modal title="Download" onClose={onClose}>
      <div className="form">
        <label className="field"><span>File type</span>
          <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
            <option value="png">PNG — best for graphics & transparency</option>
            <option value="jpg">JPG — smallest file for photos</option>
            <option value="pdf">PDF — for printing and sharing</option>
            <option value="svg">SVG — scalable vector</option>
          </select>
        </label>
        {format !== 'svg' && (
          <label className="field"><span>Size ×{mult} <span className="hint">({px})</span></span>
            <input type="range" min={0.5} max={4} step={0.5} value={mult} onChange={(e) => setMult(+e.target.value)} />
          </label>
        )}
        {(format === 'jpg' || format === 'pdf') && (
          <label className="field"><span>Quality {Math.round(quality * 100)}%</span><input type="range" min={0.5} max={1} step={0.01} value={quality} onChange={(e) => setQuality(+e.target.value)} /></label>
        )}
        {(format === 'png' || format === 'svg') && (
          <label className="check"><input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} /> Transparent background</label>
        )}
        {n > 1 && (
          <label className="field"><span>Pages</span>
            <select value={which} onChange={(e) => setWhich(e.target.value as any)}>
              <option value="all">All pages ({n}){format !== 'pdf' ? ' — one file each' : ''}</option>
              <option value="current">Current page ({ed.current + 1})</option>
            </select>
          </label>
        )}
        <Btn variant="primary" className="btn-block" onClick={go} loading={!!progress}><Download size={16} /> {progress ?? 'Download'}</Btn>
      </div>
    </Modal>
  );
}

export function ResizeDialog({ ed, onClose }: { ed: Editor; onClose: () => void }) {
  const [scale, setScale] = useState(true);
  return (
    <CustomSize title="Resize design" cta="Resize" initial={[ed.width, ed.height]} onClose={onClose}
      onCreate={(w, h) => ed.resize(w, h, scale)}
      extra={<label className="check"><input type="checkbox" checked={scale} onChange={(e) => setScale(e.target.checked)} /> Scale content to fit the new size</label>} />
  );
}
void FORMATS;

export const SHORTCUTS: [string, string][] = [
  ['T', 'Add text'], ['R', 'Add rectangle'], ['C', 'Add circle'], ['L', 'Add line'],
  ['Ctrl/⌘ Z', 'Undo'], ['Ctrl/⌘ Shift Z  ·  Ctrl Y', 'Redo'], ['Ctrl/⌘ C / X / V', 'Copy / cut / paste'], ['Ctrl/⌘ D', 'Duplicate'],
  ['Delete / Backspace', 'Delete'], ['Ctrl/⌘ A', 'Select all'], ['Ctrl/⌘ G', 'Group'], ['Ctrl/⌘ Shift G', 'Ungroup'],
  ['Ctrl/⌘ ] / [', 'Forward / backward'], ['Ctrl/⌘ Shift ] / [', 'To front / to back'], ['Ctrl/⌘ Shift L', 'Lock / unlock'],
  ['Ctrl/⌘ B / I / U', 'Bold / italic / underline'], ['Arrows', 'Nudge 1px (Shift: 10px)'], ['Ctrl/⌘ + / − / 0', 'Zoom in / out / fit'],
  ['Esc', 'Deselect / close panel'], ['?', 'This list'],
];

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Keyboard shortcuts" onClose={onClose} width={520}>
      <table className="shortcuts"><tbody>{SHORTCUTS.map(([k, d]) => <tr key={k}><td><kbd>{k}</kbd></td><td>{d}</td></tr>)}</tbody></table>
    </Modal>
  );
}
