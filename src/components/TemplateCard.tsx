import { useEffect, useRef, useState } from 'react';
import type { Template } from '../content/templates';
import { templateThumb } from '../editor/render';

export function TemplateCard({ t, onPick, compact }: { t: Template; onPick: (t: Template) => void; compact?: boolean }) {
  const [src, setSrc] = useState('');
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let alive = true;
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        io.disconnect();
        templateThumb(t.id, t.pages[0], t.w, t.h).then((u) => alive && setSrc(u));
      }
    }, { rootMargin: '200px' });
    if (ref.current) io.observe(ref.current);
    return () => { alive = false; io.disconnect(); };
  }, [t]);
  return (
    <button ref={ref} className={`tcard ${compact ? 'tcard-compact' : ''}`} onClick={() => onPick(t)} title={t.title}>
      <span className="tcard-thumb" style={{ aspectRatio: `${t.w} / ${t.h}` }}>
        {src ? <img src={src} alt="" /> : <span className="skeleton" />}
        {t.pages.length > 1 && <span className="tcard-badge">{t.pages.length} pages</span>}
      </span>
      {!compact && <span className="tcard-title">{t.title}</span>}
      {!compact && <span className="tcard-sub">{t.category}</span>}
    </button>
  );
}
