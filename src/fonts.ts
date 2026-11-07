// Open-licensed (OFL) fonts bundled locally so the app works offline and makes no third-party requests.
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/400-italic.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/800.css';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/playfair-display/400-italic.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/lora/400.css';
import '@fontsource/lora/700.css';
import '@fontsource/lora/400-italic.css';
import '@fontsource/bebas-neue/400.css';
import '@fontsource/pacifico/400.css';
import '@fontsource/oswald/400.css';
import '@fontsource/oswald/700.css';
import '@fontsource/dm-serif-display/400.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/caveat/400.css';
import '@fontsource/caveat/700.css';
import '@fontsource/abril-fatface/400.css';
import '@fontsource/archivo-black/400.css';
import '@fontsource/roboto-mono/400.css';
import '@fontsource/roboto-mono/700.css';
import '@fontsource/merriweather/400.css';
import '@fontsource/merriweather/700.css';
import '@fontsource/lobster/400.css';
import '@fontsource/raleway/400.css';
import '@fontsource/raleway/700.css';
import '@fontsource/anton/400.css';

export const FONTS: { family: string; category: string }[] = [
  { family: 'Inter', category: 'Sans' },
  { family: 'Poppins', category: 'Sans' },
  { family: 'Montserrat', category: 'Sans' },
  { family: 'Raleway', category: 'Sans' },
  { family: 'Space Grotesk', category: 'Sans' },
  { family: 'Oswald', category: 'Condensed' },
  { family: 'Bebas Neue', category: 'Display' },
  { family: 'Anton', category: 'Display' },
  { family: 'Archivo Black', category: 'Display' },
  { family: 'Abril Fatface', category: 'Display' },
  { family: 'DM Serif Display', category: 'Serif' },
  { family: 'Playfair Display', category: 'Serif' },
  { family: 'Lora', category: 'Serif' },
  { family: 'Merriweather', category: 'Serif' },
  { family: 'Pacifico', category: 'Script' },
  { family: 'Lobster', category: 'Script' },
  { family: 'Caveat', category: 'Handwriting' },
  { family: 'Roboto Mono', category: 'Mono' },
];

/** Make sure every font used by a set of fabric objects is loaded before rendering. */
export async function ensureFonts(families: Iterable<string>) {
  const list = [...new Set(families)].filter(Boolean);
  await Promise.all(
    list.flatMap((f) => [
      document.fonts.load(`400 32px "${f}"`).catch(() => undefined),
      document.fonts.load(`700 32px "${f}"`).catch(() => undefined),
      document.fonts.load(`italic 400 32px "${f}"`).catch(() => undefined),
    ]),
  );
  const failed = list.filter((f) => [...document.fonts].some((ff) => ff.family.replace(/["']/g, '') === f && ff.status === 'error'));
  if (failed.length) await Promise.all(failed.map(rescueFont));
}

const rescued = new Map<string, Promise<void>>();

/**
 * Fallback for fonts whose stylesheet load failed (in Chromium, @font-face requests can skip the service
 * worker, so a font first needed while offline fails). Fetch the same files with fetch(), which the service
 * worker does answer from its cache, and register them from the bytes.
 */
function rescueFont(family: string) {
  if (!rescued.has(family)) rescued.set(family, (async () => {
    const jobs: Promise<void>[] = [];
    for (const sheet of [...document.styleSheets]) {
      let rules: CSSRuleList;
      try { rules = sheet.cssRules; } catch { continue; }
      for (const rule of [...rules]) {
        if (!(rule instanceof CSSFontFaceRule)) continue;
        const st = rule.style;
        if (st.getPropertyValue('font-family').replace(/["']/g, '').trim() !== family) continue;
        const m = st.getPropertyValue('src').match(/url\(["']?([^"')]+\.woff2)["']?\)/);
        if (!m) continue;
        const url = new URL(m[1], sheet.href ?? location.href).href;
        jobs.push((async () => {
          try {
            const buf = await (await fetch(url)).arrayBuffer();
            const face = new FontFace(family, buf, {
              weight: st.getPropertyValue('font-weight') || '400',
              style: st.getPropertyValue('font-style') || 'normal',
              unicodeRange: st.getPropertyValue('unicode-range') || undefined,
            });
            await face.load();
            document.fonts.add(face);
          } catch { /* leave the fallback font */ }
        })());
      }
    }
    await Promise.all(jobs);
  })());
  return rescued.get(family)!;
}

export function fontsInJSON(json: unknown): string[] {
  const out: string[] = [];
  const walk = (o: any) => {
    if (!o || typeof o !== 'object') return;
    if (typeof o.fontFamily === 'string') out.push(o.fontFamily);
    if (Array.isArray(o.objects)) o.objects.forEach(walk);
  };
  walk(json);
  return out;
}
