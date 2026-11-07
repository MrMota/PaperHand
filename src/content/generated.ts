// Procedurally generated imagery — Paperhand ships no stock photos.
export interface GenImage { id: string; name: string; tags: string }

export const GEN_IMAGES: GenImage[] = [
  { id: 'mesh-sunset', name: 'Sunset mesh', tags: 'warm abstract background' },
  { id: 'mesh-ocean', name: 'Ocean mesh', tags: 'cool blue abstract' },
  { id: 'mesh-candy', name: 'Candy mesh', tags: 'pink pastel abstract' },
  { id: 'mesh-forest', name: 'Forest mesh', tags: 'green nature abstract' },
  { id: 'mesh-night', name: 'Night mesh', tags: 'dark purple abstract' },
  { id: 'bokeh-gold', name: 'Golden bokeh', tags: 'lights party festive' },
  { id: 'bokeh-blue', name: 'Blue bokeh', tags: 'lights night city' },
  { id: 'dunes', name: 'Dunes', tags: 'desert landscape sand' },
  { id: 'hills', name: 'Rolling hills', tags: 'landscape nature green' },
  { id: 'peaks', name: 'Mountain peaks', tags: 'landscape mountains travel' },
  { id: 'sea', name: 'Sea horizon', tags: 'ocean beach summer' },
  { id: 'stripes', name: 'Retro stripes', tags: 'pattern 70s vintage' },
  { id: 'dots', name: 'Polka dots', tags: 'pattern cute' },
  { id: 'grid', name: 'Paper grid', tags: 'pattern notebook' },
  { id: 'marble', name: 'Marble', tags: 'texture stone luxury' },
  { id: 'paper', name: 'Paper texture', tags: 'texture grain craft' },
  { id: 'confetti', name: 'Confetti', tags: 'party birthday celebration' },
  { id: 'terrazzo', name: 'Terrazzo', tags: 'pattern texture' },
];

const cache = new Map<string, string>();

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amt = 14) {
  const img = ctx.getImageData(0, 0, w, h);
  const r = rng(7);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * amt;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

function mesh(ctx: CanvasRenderingContext2D, w: number, h: number, base: string, blobs: string[], seed: number) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  const r = rng(seed);
  blobs.forEach((c) => {
    const x = r() * w, y = r() * h, rad = (0.4 + r() * 0.5) * Math.max(w, h);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, c); g.addColorStop(1, c + '00');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
  grain(ctx, w, h, 10);
}

function bokeh(ctx: CanvasRenderingContext2D, w: number, h: number, bg: [string, string], cols: string[], seed: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const r = rng(seed);
  for (let i = 0; i < 70; i++) {
    const x = r() * w, y = r() * h, rad = 10 + r() * 70, c = cols[i % cols.length];
    const rg = ctx.createRadialGradient(x, y, 0, x, y, rad);
    rg.addColorStop(0, c + 'AA'); rg.addColorStop(0.7, c + '55'); rg.addColorStop(1, c + '00');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
  }
}

function layers(ctx: CanvasRenderingContext2D, w: number, h: number, sky: [string, string], cols: string[], seed: number, sharp = false) {
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const r = rng(seed);
  ctx.fillStyle = '#FFF4D6'; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(w * 0.7, h * 0.3, h * 0.08, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  cols.forEach((c, li) => {
    const baseY = h * (0.45 + li * 0.14);
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, h);
    const steps = sharp ? 7 : 5;
    for (let i = 0; i <= steps; i++) {
      const x = (w / steps) * i, y = baseY - r() * h * 0.18;
      if (sharp) ctx.lineTo(x, y); else ctx.quadraticCurveTo(x - w / steps / 2, y - h * 0.08, x, y);
    }
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  });
}

export function genImage(id: string, w = 1200, h = 900): string {
  const key = `${id}:${w}x${h}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  const r = rng(id.length * 31 + 3);
  switch (id) {
    case 'mesh-sunset': mesh(ctx, w, h, '#F6B48F', ['#F96E46', '#FFD166', '#C8553D', '#FFB4A2'], 11); break;
    case 'mesh-ocean': mesh(ctx, w, h, '#1D4E89', ['#0096C7', '#90E0EF', '#03045E', '#48CAE4'], 21); break;
    case 'mesh-candy': mesh(ctx, w, h, '#FBC2EB', ['#A18CD1', '#FAD0C4', '#FF9A9E', '#FFFFFF'], 31); break;
    case 'mesh-forest': mesh(ctx, w, h, '#2D6A4F', ['#95D5B2', '#1B4332', '#D8F3DC', '#52B788'], 41); break;
    case 'mesh-night': mesh(ctx, w, h, '#14112B', ['#5B3FA6', '#E4577A', '#1D4E89', '#2B1B3F'], 51); break;
    case 'bokeh-gold': bokeh(ctx, w, h, ['#2B1B10', '#5A3A1A'], ['#FFD166', '#F29E4C', '#FFF1C1'], 3); break;
    case 'bokeh-blue': bokeh(ctx, w, h, ['#0B1026', '#1D2B5A'], ['#48CAE4', '#9C6ADE', '#E3EEF8'], 5); break;
    case 'dunes': layers(ctx, w, h, ['#F8D9A0', '#F3A971'], ['#E9A066', '#D9844E', '#B9663A'], 9); break;
    case 'hills': layers(ctx, w, h, ['#BDE0FE', '#E8F3EC'], ['#95D5B2', '#52B788', '#2D6A4F'], 13); break;
    case 'peaks': layers(ctx, w, h, ['#A2C4E0', '#F1E3D3'], ['#7D8CA3', '#4A6C8C', '#2C3E50'], 17, true); break;
    case 'sea': {
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#FAD6A5'); g.addColorStop(0.55, '#F7A072'); g.addColorStop(0.551, '#2E8BC0'); g.addColorStop(1, '#0C2D48');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#FFE8B0'; ctx.beginPath(); ctx.arc(w / 2, h * 0.55, h * 0.12, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#FFE8B055'; ctx.lineWidth = 3;
      for (let i = 0; i < 30; i++) { const y = h * 0.58 + r() * h * 0.35; const x = w / 2 + (r() - 0.5) * w * 0.4; ctx.beginPath(); ctx.moveTo(x - 30 - r() * 60, y); ctx.lineTo(x + 30 + r() * 60, y); ctx.stroke(); }
      break;
    }
    case 'stripes': {
      const cols = ['#F4E1C1', '#F2B632', '#E4572E', '#9A360B', '#3B2416'];
      ctx.fillStyle = cols[0]; ctx.fillRect(0, 0, w, h);
      const bw = h / 14;
      cols.slice(1).forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, h * 0.45 + i * bw, w, bw); });
      grain(ctx, w, h, 12); break;
    }
    case 'dots': {
      ctx.fillStyle = '#FBE9DF'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#E4577A';
      const step = 60; for (let y = 0; y < h + step; y += step) for (let x = (y / step) % 2 ? step / 2 : 0; x < w + step; x += step) { ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case 'grid': {
      ctx.fillStyle = '#FCFBF7'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#C9DCEB'; ctx.lineWidth = 1.5;
      for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      break;
    }
    case 'marble': {
      ctx.fillStyle = '#F4F2EE'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 14; i++) {
        ctx.strokeStyle = i % 3 ? '#BDB6AA55' : '#8F887C66'; ctx.lineWidth = 1 + r() * 4;
        ctx.beginPath(); let x = r() * w, y = 0; ctx.moveTo(x, y);
        while (y < h) { x += (r() - 0.5) * 120; y += 40 + r() * 60; ctx.lineTo(x, y); }
        ctx.stroke();
      }
      grain(ctx, w, h, 8); break;
    }
    case 'paper': ctx.fillStyle = '#EFE6D6'; ctx.fillRect(0, 0, w, h); grain(ctx, w, h, 26); break;
    case 'confetti': {
      ctx.fillStyle = '#FFF8EE'; ctx.fillRect(0, 0, w, h);
      const cols = ['#E4572E', '#F2B632', '#3BB273', '#2E8BC0', '#9C6ADE', '#E4577A'];
      for (let i = 0; i < 160; i++) { ctx.save(); ctx.translate(r() * w, r() * h); ctx.rotate(r() * Math.PI); ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-4, -10, 8, 20); ctx.restore(); }
      break;
    }
    case 'terrazzo': {
      ctx.fillStyle = '#F2EDE4'; ctx.fillRect(0, 0, w, h);
      const cols = ['#E4572E', '#2E8BC0', '#F2B632', '#1E7F5C', '#3B3833'];
      for (let i = 0; i < 220; i++) {
        ctx.fillStyle = cols[i % cols.length]; ctx.beginPath();
        const x = r() * w, y = r() * h, s = 4 + r() * 16, n = 5 + Math.floor(r() * 3);
        for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; const rr = s * (0.6 + r() * 0.6); ctx[k ? 'lineTo' : 'moveTo'](x + rr * Math.cos(a), y + rr * Math.sin(a)); }
        ctx.closePath(); ctx.fill();
      }
      break;
    }
    default: ctx.fillStyle = '#ccc'; ctx.fillRect(0, 0, w, h);
  }
  const url = c.toDataURL('image/jpeg', 0.9);
  cache.set(key, url);
  return url;
}
