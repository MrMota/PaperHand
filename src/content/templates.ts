// Paperhand's own template collection. Layouts × palettes × copy — all written for this project.
import type { PageSpec, Spec } from './spec';
import { STICKERS } from './stickers';
import type { FillSpec } from './palette';
import { GRADIENTS } from './palette';

export interface Template { id: string; title: string; category: string; w: number; h: number; pages: PageSpec[]; tags: string }

export const FORMATS = [
  { id: 'square', name: 'Square post', w: 1080, h: 1080 },
  { id: 'story', name: 'Story', w: 1080, h: 1920 },
  { id: 'presentation', name: 'Presentation', w: 1920, h: 1080 },
  { id: 'poster', name: 'Poster (A4)', w: 1240, h: 1754 },
  { id: 'flyer', name: 'Flyer (Letter)', w: 1275, h: 1650 },
  { id: 'thumbnail', name: 'Video thumbnail', w: 1280, h: 720 },
  { id: 'banner', name: 'Social banner', w: 1640, h: 624 },
  { id: 'card', name: 'Business card', w: 1050, h: 600 },
  { id: 'logo', name: 'Logo', w: 800, h: 800 },
  { id: 'invitation', name: 'Invitation (5×7)', w: 1400, h: 1960 },
  { id: 'resume', name: 'Resume', w: 1240, h: 1754 },
  { id: 'certificate', name: 'Certificate', w: 2000, h: 1414 },
  { id: 'wide', name: 'Wide post', w: 1600, h: 900 },
  { id: 'portrait', name: 'Portrait post', w: 1080, h: 1350 },
] as const;

const F = Object.fromEntries(FORMATS.map((f) => [f.id, f])) as unknown as Record<(typeof FORMATS)[number]['id'], { w: number; h: number; name: string }>;

interface Pal { bg: string; ink: string; accent: string; accent2: string; soft: string; head: string; body: string; dark: boolean }

const PALS: Record<string, Pal> = {
  terracotta: { bg: '#F6EDE3', ink: '#2B1D14', accent: '#C4552D', accent2: '#E9B44C', soft: '#EAD8C6', head: 'DM Serif Display', body: 'Inter', dark: false },
  midnight: { bg: '#11142B', ink: '#F4F1EA', accent: '#F2B632', accent2: '#5B8DEF', soft: '#22264A', head: 'Montserrat', body: 'Inter', dark: true },
  sage: { bg: '#E7EFE6', ink: '#1F3326', accent: '#3E7C59', accent2: '#D98E73', soft: '#CFE0D1', head: 'Playfair Display', body: 'Lora', dark: false },
  candy: { bg: '#FFE4EC', ink: '#3A1030', accent: '#E4477A', accent2: '#6C4BD1', soft: '#FFC9DA', head: 'Poppins', body: 'Poppins', dark: false },
  mono: { bg: '#FFFFFF', ink: '#111111', accent: '#111111', accent2: '#FF4D2E', soft: '#EFEFEF', head: 'Archivo Black', body: 'Space Grotesk', dark: false },
  ocean: { bg: '#E6F1F8', ink: '#0C2D48', accent: '#1F6FB2', accent2: '#2EC4B6', soft: '#C8E0F0', head: 'Raleway', body: 'Raleway', dark: false },
  sunshine: { bg: '#FFF6D8', ink: '#2E2A1F', accent: '#F28C28', accent2: '#2E8B57', soft: '#FFE9A8', head: 'Bebas Neue', body: 'Montserrat', dark: false },
  noir: { bg: '#161412', ink: '#F3EDE3', accent: '#D4A55A', accent2: '#8C6B3E', soft: '#2A2622', head: 'Playfair Display', body: 'Raleway', dark: true },
};

const g = (id: string): FillSpec => GRADIENTS.find((x) => x.id === id)!.g;
const sticker = (id: string) => STICKERS.find((s) => s.id === id)!.svg;
const T = (text: string, x: number, y: number, w: number, size: number, font: string, color: FillSpec, more: Partial<Extract<Spec, { t: 'text' }>> = {}): Spec => ({ t: 'text', text, x, y, w, size, font, color, ...more });

let n = 0;
const tpl = (title: string, category: keyof typeof F, pages: PageSpec[], tags = ''): Template => ({ id: `t${++n}`, title, category: F[category].name, w: F[category].w, h: F[category].h, pages, tags });

// ---------- layouts ----------
function quotePost(p: Pal, quote: string, by: string): PageSpec {
  return { bg: p.bg, items: [
    { t: 'shape', shape: 'blob1', x: 640, y: -120, w: 560, h: 560, fill: p.soft },
    T('“', 100, 90, 300, 300, p.head, p.accent, { lh: 1 }),
    T(quote, 110, 360, 860, 76, p.head, p.ink, { lh: 1.15 }),
    { t: 'rect', x: 112, y: 830, w: 90, h: 8, fill: p.accent },
    T(by, 112, 860, 700, 34, p.body, p.ink, { ls: 120, upper: true, weight: 600 }),
  ] };
}

function salePost(p: Pal, head: string, pct: string, sub: string): PageSpec {
  return { bg: p.bg, items: [
    { t: 'ellipse', x: -200, y: 600, w: 700, h: 700, fill: p.soft },
    { t: 'shape', shape: 'burst', x: 600, y: 120, w: 380, h: 380, fill: p.accent, angle: 0 },
    T(pct, 600, 230, 380, 120, p.head, p.dark ? p.bg : '#FFFFFF', { align: 'center', weight: 800 }),
    T('OFF', 600, 360, 380, 44, p.body, p.dark ? p.bg : '#FFFFFF', { align: 'center', ls: 300, weight: 700 }),
    T(head, 90, 560, 900, 150, p.head, p.ink, { lh: 0.95, weight: 800, upper: true }),
    T(sub, 94, 900, 700, 34, p.body, p.ink, { weight: 600 }),
    { t: 'rect', x: 94, y: 960, w: 300, h: 4, fill: p.accent2 },
  ] };
}

function photoPost(p: Pal, img: string, title: string, sub: string): PageSpec {
  return { bg: p.bg, items: [
    { t: 'img', src: `gen:${img}`, x: 0, y: 0, w: 1080, h: 1080 },
    { t: 'rect', x: 0, y: 540, w: 1080, h: 540, fill: { type: 'linear', angle: 180, stops: [[0, '#00000000'], [1, '#000000B3']] } },
    T(sub, 80, 780, 900, 32, p.body, '#FFFFFF', { ls: 200, upper: true, weight: 600 }),
    T(title, 80, 830, 920, 96, p.head, '#FFFFFF', { lh: 1.05 }),
  ] };
}

function tipsPost(p: Pal, title: string, tips: string[], icon: string): PageSpec {
  const items: Spec[] = [
    { t: 'rect', x: 50, y: 50, w: 980, h: 980, fill: p.dark ? p.soft : '#FFFFFF', rx: 40, shadow: '#0000001A 30 0 10' },
    T(title, 110, 120, 700, 72, p.head, p.ink, { lh: 1.05, weight: 700 }),
    { t: 'svg', svg: sticker(icon), x: 820, y: 100, w: 150 },
  ];
  tips.forEach((tip, i) => {
    const y = 420 + i * 180;
    items.push({ t: 'ellipse', x: 110, y, w: 100, h: 100, fill: p.accent });
    items.push(T(String(i + 1), 110, y + 18, 100, 54, p.head, p.dark ? p.bg : '#FFFFFF', { align: 'center', weight: 700 }));
    items.push(T(tip, 250, y + 18, 700, 40, p.body, p.ink, { lh: 1.25 }));
  });
  return { bg: p.bg, items };
}

function storyAnnounce(p: Pal, img: string, kicker: string, title: string, cta: string): PageSpec {
  return { bg: p.bg, items: [
    { t: 'img', src: `gen:${img}`, x: 140, y: 180, w: 800, h: 980, frame: 'arch' },
    { t: 'svg', svg: sticker('sparkles'), x: 820, y: 130, w: 170 },
    T(kicker, 120, 1240, 840, 40, p.body, p.accent, { align: 'center', ls: 300, upper: true, weight: 700 }),
    T(title, 100, 1310, 880, 120, p.head, p.ink, { align: 'center', lh: 1 }),
    { t: 'rect', x: 290, y: 1630, w: 500, h: 120, fill: p.accent, rx: 60 },
    T(cta, 290, 1665, 500, 44, p.body, p.dark ? p.bg : '#FFFFFF', { align: 'center', weight: 700 }),
  ] };
}

function storyGradient(grad: string, title: string, sub: string, dark = false): PageSpec {
  const ink = dark ? '#FFFFFF' : '#1E1B16';
  return { bg: g(grad), items: [
    { t: 'shape', shape: 'ring', x: 640, y: -160, w: 640, h: 640, fill: '#FFFFFF', opacity: 0.18 },
    { t: 'shape', shape: 'star4', x: 120, y: 1500, w: 180, h: 180, fill: '#FFFFFF', opacity: 0.6 },
    T(title, 100, 700, 880, 150, 'Poppins', ink, { lh: 1, weight: 800 }),
    T(sub, 104, 1080, 820, 46, 'Inter', ink, { lh: 1.35 }),
  ] };
}

function eventPoster(p: Pal, kicker: string, title: string, date: string, place: string, img: string): PageSpec {
  return { bg: p.bg, items: [
    { t: 'img', src: `gen:${img}`, x: 0, y: 0, w: 1240, h: 1000 },
    { t: 'rect', x: 0, y: 1000, w: 1240, h: 754, fill: p.bg },
    { t: 'rect', x: 90, y: 920, w: 380, h: 80, fill: p.accent },
    T(kicker, 90, 942, 380, 34, p.body, p.dark ? p.bg : '#FFFFFF', { align: 'center', ls: 200, upper: true, weight: 700 }),
    T(title, 86, 1060, 1080, 170, p.head, p.ink, { lh: 0.95, upper: true }),
    { t: 'line', x1: 90, y1: 1460, x2: 1150, y2: 1460, stroke: p.ink, sw: 3 },
    T(date, 90, 1500, 520, 46, p.body, p.ink, { weight: 700 }),
    T(place, 640, 1500, 510, 40, p.body, p.ink, { align: 'right' }),
  ] };
}

function minimalPoster(p: Pal, title: string, sub: string, foot: string): PageSpec {
  return { bg: p.bg, items: [
    { t: 'ellipse', x: 270, y: 260, w: 700, h: 700, fill: p.accent },
    { t: 'rect', x: 0, y: 760, w: 1240, h: 200, fill: p.bg },
    { t: 'rect', x: 200, y: 700, w: 840, h: 10, fill: p.ink },
    { t: 'rect', x: 260, y: 740, w: 720, h: 10, fill: p.ink },
    T(title, 100, 1000, 1040, 140, p.head, p.ink, { align: 'center', lh: 1 }),
    T(sub, 150, 1200, 940, 40, p.body, p.ink, { align: 'center', lh: 1.4 }),
    T(foot, 100, 1600, 1040, 30, p.body, p.ink, { align: 'center', ls: 400, upper: true }),
  ] };
}

function presentation(p: Pal, title: string, sub: string, img: string, agenda: string[]): PageSpec[] {
  const W = 1920, H = 1080;
  return [
    { bg: p.bg, items: [
      { t: 'img', src: `gen:${img}`, x: 1060, y: 0, w: 860, h: H },
      { t: 'rect', x: 120, y: 330, w: 120, h: 12, fill: p.accent },
      T(title, 120, 380, 880, 120, p.head, p.ink, { lh: 1.02 }),
      T(sub, 124, 700, 820, 40, p.body, p.ink, { lh: 1.4 }),
      T('Presented by Your Name · 2026', 124, 940, 820, 28, p.body, p.ink, { opacity: 0.7 }),
    ] },
    { bg: p.bg, items: [
      T('Agenda', 120, 120, 800, 90, p.head, p.ink),
      ...agenda.flatMap((a, i): Spec[] => [
        { t: 'rect', x: 120 + (i % 2) * 860, y: 320 + Math.floor(i / 2) * 300, w: 800, h: 240, fill: p.dark ? p.soft : '#FFFFFF', rx: 24, shadow: '#00000014 30 0 8' },
        T(`0${i + 1}`, 170 + (i % 2) * 860, 360 + Math.floor(i / 2) * 300, 200, 64, p.head, p.accent),
        T(a, 170 + (i % 2) * 860, 450 + Math.floor(i / 2) * 300, 700, 40, p.body, p.ink, { weight: 600 }),
      ]),
    ] },
    { bg: p.accent, items: [
      { t: 'shape', shape: 'ring', x: 1300, y: 500, w: 800, h: 800, fill: '#FFFFFF', opacity: 0.12 },
      T('Key insight', 160, 300, 1200, 40, p.body, '#FFFFFF', { ls: 300, upper: true, weight: 700 }),
      T('One big idea, stated plainly, deserves a slide of its own.', 160, 380, 1400, 100, p.head, '#FFFFFF', { lh: 1.1 }),
    ] },
    { bg: p.bg, items: [
      T('Thank you', 0, 380, W, 160, p.head, p.ink, { align: 'center' }),
      T('hello@yourcompany.com  ·  yourcompany.com', 0, 600, W, 36, p.body, p.ink, { align: 'center' }),
      { t: 'rect', x: W / 2 - 60, y: 700, w: 120, h: 10, fill: p.accent },
    ] },
  ];
}

function thumbnail(p: Pal, title: string, img: string, badge: string): PageSpec {
  return { bg: p.accent2, items: [
    { t: 'img', src: `gen:${img}`, x: 760, y: 80, w: 460, h: 560, frame: 'blob3' },
    T(title, 60, 120, 720, 130, 'Anton', '#FFFFFF', { lh: 1.0, upper: true, stroke: p.ink, sw: 10, shadow: '#00000066 0 10 10' }),
    { t: 'shape', shape: 'burst', x: 60, y: 520, w: 170, h: 170, fill: p.accent2 === '#F2B632' ? '#E4572E' : '#F2B632' },
    T(badge, 60, 580, 170, 40, 'Archivo Black', p.ink, { align: 'center' }),
    { t: 'svg', svg: sticker('arrowdoodle'), x: 560, y: 440, w: 220 },
  ] };
}

function bizCard(p: Pal, name: string, role: string, lines: string[]): PageSpec[] {
  return [
    { bg: p.bg, items: [
      { t: 'rect', x: 0, y: 0, w: 24, h: 600, fill: p.accent },
      T(name, 90, 140, 800, 74, p.head, p.ink),
      T(role, 94, 240, 800, 30, p.body, p.accent, { ls: 200, upper: true, weight: 700 }),
      { t: 'line', x1: 94, y1: 320, x2: 300, y2: 320, stroke: p.ink, sw: 3 },
      ...lines.map((l, i) => T(l, 94, 370 + i * 50, 800, 28, p.body, p.ink)),
    ] },
    { bg: p.accent, items: [
      { t: 'shape', shape: 'flower', x: 425, y: 200, w: 200, h: 200, fill: p.dark ? p.bg : '#FFFFFF' },
    ] },
  ];
}

function logo(p: Pal, name: string, shape: string, tagline: string): PageSpec {
  return { bg: p.bg, items: [
    { t: 'shape', shape, x: 300, y: 160, w: 200, h: 200, fill: p.accent },
    { t: 'shape', shape: 'circle', x: 360, y: 220, w: 80, h: 80, fill: p.accent2, opacity: 0.9 },
    T(name, 0, 420, 800, 96, p.head, p.ink, { align: 'center' }),
    T(tagline, 0, 550, 800, 26, p.body, p.ink, { align: 'center', ls: 400, upper: true }),
  ] };
}

function invitation(p: Pal, kicker: string, names: string, date: string, place: string, deco: string): PageSpec {
  return { bg: p.bg, items: [
    { t: 'rect', x: 70, y: 70, w: 1260, h: 1820, fill: 'transparent', stroke: p.accent, sw: 4 },
    { t: 'rect', x: 95, y: 95, w: 1210, h: 1770, fill: 'transparent', stroke: p.accent, sw: 1.5 },
    { t: 'svg', svg: sticker(deco), x: 560, y: 220, w: 280 },
    T(kicker, 150, 600, 1100, 40, p.body, p.ink, { align: 'center', ls: 300, upper: true }),
    T(names, 120, 720, 1160, 170, 'Pacifico', p.accent, { align: 'center', lh: 1.2 }),
    T(date, 150, 1240, 1100, 54, p.head, p.ink, { align: 'center' }),
    T(place, 150, 1340, 1100, 38, p.body, p.ink, { align: 'center', lh: 1.4 }),
    T('Kindly reply by May 1', 150, 1680, 1100, 30, p.body, p.ink, { align: 'center', italic: true }),
  ] };
}

function resume(p: Pal, name: string, role: string): PageSpec {
  const side: Spec[] = [
    { t: 'rect', x: 0, y: 0, w: 420, h: 1754, fill: p.soft },
    { t: 'img', src: 'gen:mesh-candy', x: 90, y: 100, w: 240, h: 240, frame: 'circle' },
    T('Contact', 70, 420, 300, 30, p.body, p.accent, { upper: true, ls: 200, weight: 700 }),
    T('hello@email.com\n+1 555 010 2030\nyourcity.com\nYour City, Country', 70, 470, 300, 24, p.body, p.ink, { lh: 1.7 }),
    T('Skills', 70, 720, 300, 30, p.body, p.accent, { upper: true, ls: 200, weight: 700 }),
    T('Brand strategy\nVisual design\nTypography\nArt direction\nPrototyping\nPublic speaking', 70, 770, 300, 24, p.body, p.ink, { lh: 1.7 }),
    T('Languages', 70, 1100, 300, 30, p.body, p.accent, { upper: true, ls: 200, weight: 700 }),
    T('English — native\nSpanish — fluent\nJapanese — basic', 70, 1150, 300, 24, p.body, p.ink, { lh: 1.7 }),
  ];
  const job = (y: number, t: string, c: string, d: string): Spec[] => [
    T(t, 500, y, 660, 32, p.body, p.ink, { weight: 700 }),
    T(c, 500, y + 44, 660, 24, p.body, p.accent, { weight: 600 }),
    T(d, 500, y + 84, 660, 22, p.body, p.ink, { lh: 1.5 }),
  ];
  return { bg: '#FFFFFF', items: [
    ...side,
    T(name, 500, 110, 680, 84, p.head, p.ink, { lh: 1 }),
    T(role, 504, 220, 680, 30, p.body, p.accent, { upper: true, ls: 200, weight: 600 }),
    T('A short paragraph about who you are, what you are great at and the kind of work you want to do next. Keep it to three lines.', 504, 300, 660, 24, p.body, p.ink, { lh: 1.6 }),
    T('Experience', 500, 470, 660, 34, p.body, p.ink, { upper: true, ls: 200, weight: 700 }),
    { t: 'line', x1: 500, y1: 520, x2: 1160, y2: 520, stroke: p.accent, sw: 3 },
    ...job(560, 'Senior Designer', 'Studio North · 2022 – now', 'Led rebrands for twelve clients, built a shared component library and mentored four juniors.'),
    ...job(780, 'Designer', 'Brightside Agency · 2019 – 2022', 'Designed campaigns across print, social and web; owned the motion style guide.'),
    ...job(1000, 'Junior Designer', 'Paper & Co · 2017 – 2019', 'Packaging, editorial layouts and in-store signage for a growing stationery brand.'),
    T('Education', 500, 1240, 660, 34, p.body, p.ink, { upper: true, ls: 200, weight: 700 }),
    { t: 'line', x1: 500, y1: 1290, x2: 1160, y2: 1290, stroke: p.accent, sw: 3 },
    ...job(1330, 'BA Graphic Design', 'City School of Art · 2013 – 2017', 'Graduated with honours. Thesis on variable type systems.'),
  ] };
}

function flyer(p: Pal, title: string, sub: string, feats: string[], img: string): PageSpec {
  return { bg: p.bg, items: [
    { t: 'img', src: `gen:${img}`, x: 0, y: 0, w: 1275, h: 760 },
    { t: 'shape', shape: 'semicircle', x: -100, y: 600, w: 1475, h: 320, fill: p.bg },
    T(title, 90, 820, 1100, 120, p.head, p.ink, { lh: 1, align: 'center', weight: 700 }),
    T(sub, 140, 1100, 1000, 36, p.body, p.ink, { align: 'center', lh: 1.4 }),
    ...feats.flatMap((f, i): Spec[] => [
      { t: 'shape', shape: 'circle', x: 150 + i * 340, y: 1250, w: 120, h: 120, fill: p.accent },
      { t: 'shape', shape: 'star4', x: 180 + i * 340, y: 1280, w: 60, h: 60, fill: p.dark ? p.bg : '#FFFFFF' },
      T(f, 70 + i * 340, 1400, 280, 30, p.body, p.ink, { align: 'center', weight: 700 }),
    ]),
    { t: 'rect', x: 0, y: 1530, w: 1275, h: 120, fill: p.accent },
    T('www.yourwebsite.com  ·  (555) 010-2030', 0, 1572, 1275, 32, p.body, p.dark ? p.bg : '#FFFFFF', { align: 'center', weight: 600 }),
  ] };
}

function banner(p: Pal, title: string, sub: string, img: string): PageSpec {
  return { bg: p.bg, items: [
    { t: 'img', src: `gen:${img}`, x: 980, y: 0, w: 660, h: 624, frame: 'square' },
    { t: 'shape', shape: 'parallelogram', x: 860, y: 0, w: 260, h: 624, fill: p.bg },
    T(title, 100, 180, 820, 96, p.head, p.ink, { lh: 1 }),
    T(sub, 104, 400, 760, 34, p.body, p.ink),
    { t: 'rect', x: 104, y: 470, w: 160, h: 8, fill: p.accent },
  ] };
}

function menu(p: Pal, name: string, sections: [string, [string, string][]][]): PageSpec {
  const items: Spec[] = [
    T(name, 100, 110, 1040, 120, p.head, p.ink, { align: 'center' }),
    T('Seasonal kitchen · Open daily', 100, 260, 1040, 30, p.body, p.accent, { align: 'center', ls: 300, upper: true }),
    { t: 'svg', svg: sticker('leaf'), x: 570, y: 320, w: 100 },
  ];
  let y = 480;
  sections.forEach(([sec, dishes]) => {
    items.push(T(sec, 140, y, 960, 44, p.head, p.accent));
    y += 80;
    dishes.forEach(([d, price]) => {
      items.push(T(d, 140, y, 760, 30, p.body, p.ink));
      items.push(T(price, 900, y, 200, 30, p.body, p.ink, { align: 'right', weight: 700 }));
      y += 56;
    });
    y += 50;
  });
  return { bg: p.bg, items };
}

function certificate(p: Pal, title: string, name: string): PageSpec {
  return { bg: p.bg, items: [
    { t: 'rect', x: 60, y: 60, w: 1880, h: 1294, fill: 'transparent', stroke: p.accent, sw: 12 },
    { t: 'rect', x: 100, y: 100, w: 1800, h: 1214, fill: 'transparent', stroke: p.accent2, sw: 3 },
    { t: 'svg', svg: sticker('ribbon'), x: 880, y: 160, w: 240 },
    T(title, 200, 380, 1600, 120, p.head, p.ink, { align: 'center', upper: true, ls: 100 }),
    T('This certificate is proudly presented to', 200, 560, 1600, 40, p.body, p.ink, { align: 'center' }),
    T(name, 200, 640, 1600, 150, 'Pacifico', p.accent, { align: 'center' }),
    { t: 'line', x1: 500, y1: 860, x2: 1500, y2: 860, stroke: p.ink, sw: 3 },
    T('for outstanding dedication, creativity and the courage to try new things.', 300, 900, 1400, 36, p.body, p.ink, { align: 'center', lh: 1.4 }),
    { t: 'line', x1: 300, y1: 1180, x2: 750, y2: 1180, stroke: p.ink, sw: 2 },
    { t: 'line', x1: 1250, y1: 1180, x2: 1700, y2: 1180, stroke: p.ink, sw: 2 },
    T('Date', 300, 1200, 450, 28, p.body, p.ink, { align: 'center' }),
    T('Signature', 1250, 1200, 450, 28, p.body, p.ink, { align: 'center' }),
    { t: 'shape', shape: 'burst', x: 920, y: 1080, w: 160, h: 160, fill: p.accent2 },
  ] };
}

function wideQuote(p: Pal, quote: string, img: string): PageSpec {
  return { bg: p.bg, items: [
    { t: 'img', src: `gen:${img}`, x: 0, y: 0, w: 700, h: 900 },
    T(quote, 800, 260, 700, 64, p.head, p.ink, { lh: 1.2 }),
    { t: 'rect', x: 800, y: 640, w: 120, h: 8, fill: p.accent },
  ] };
}

function portraitPromo(p: Pal, title: string, price: string, img: string): PageSpec {
  return { bg: p.bg, items: [
    { t: 'img', src: `gen:${img}`, x: 90, y: 90, w: 900, h: 760, frame: 'rounded' },
    T(title, 90, 900, 900, 92, p.head, p.ink, { lh: 1.05 }),
    { t: 'rect', x: 90, y: 1150, w: 360, h: 110, fill: p.accent, rx: 55 },
    T(price, 90, 1180, 360, 44, p.body, p.dark ? p.bg : '#FFFFFF', { align: 'center', weight: 700 }),
    { t: 'svg', svg: sticker('sparkles'), x: 840, y: 1100, w: 160 },
  ] };
}

const P = PALS;

export const TEMPLATES: Template[] = [
  tpl('Quiet confidence quote', 'square', [quotePost(P.terracotta, 'Make the small things beautiful and the big things follow.', 'A note to self')], 'quote motivation'),
  tpl('Night owl quote', 'square', [quotePost(P.midnight, 'Ideas arrive late. Stay up and greet them.', 'Studio journal')], 'quote dark'),
  tpl('Garden thought', 'square', [quotePost(P.sage, 'Grow slowly. Roots first, then flowers.', 'Weekly reminder')], 'quote nature'),
  tpl('Bold statement', 'square', [quotePost(P.mono, 'Less noise. More signal.', 'Design principle 01')], 'quote minimal'),
  tpl('Summer sale', 'square', [salePost(P.sunshine, 'Summer sale', '40%', 'This weekend only · In store & online')], 'sale shop discount'),
  tpl('Flash sale pink', 'square', [salePost(P.candy, 'Flash sale', '25%', 'Ends Sunday at midnight')], 'sale shop'),
  tpl('Black friday', 'square', [salePost(P.noir, 'Black friday', '60%', 'Our biggest drop of the year')], 'sale dark'),
  tpl('Mountain escape', 'square', [photoPost(P.ocean, 'peaks', 'Find your quiet place', 'Travel guide')], 'travel photo'),
  tpl('Golden hour', 'square', [photoPost(P.terracotta, 'sea', 'Chasing the last light', 'Weekend diary')], 'photo sunset'),
  tpl('Desert notes', 'square', [photoPost(P.sunshine, 'dunes', 'Twelve days on the sand', 'Field notes')], 'travel photo'),
  tpl('Three habits', 'square', [tipsPost(P.sage, '3 habits for calmer mornings', ['Leave your phone in another room', 'Drink a full glass of water', 'Write one sentence about today'], 'coffee')], 'tips list education'),
  tpl('Launch checklist', 'square', [tipsPost(P.midnight, 'Before you launch', ['Test the checkout twice', 'Tell ten friends personally', 'Celebrate, then fix bugs'], 'rocket')], 'tips business'),
  tpl('Study smarter', 'square', [tipsPost(P.ocean, 'Study smarter, not longer', ['25 minutes on, 5 minutes off', 'Teach it to a friend', 'Sleep on hard problems'], 'bolt')], 'tips education'),
  tpl('New arrivals story', 'story', [storyAnnounce(P.candy, 'mesh-candy', 'Just landed', 'The spring collection', 'Shop now')], 'story shop fashion'),
  tpl('Workshop story', 'story', [storyAnnounce(P.terracotta, 'mesh-sunset', 'Join us', 'Clay & coffee workshop', 'Save a seat')], 'story event'),
  tpl('Podcast story', 'story', [storyAnnounce(P.midnight, 'bokeh-blue', 'New episode', 'Building in public', 'Listen now')], 'story podcast'),
  tpl('Gradient story — peach', 'story', [storyGradient('peach', 'Monday mood', 'Soft start, strong finish. What are you working on this week?')], 'story gradient'),
  tpl('Gradient story — dusk', 'story', [storyGradient('dusk', 'Ask me anything', 'Drop your questions below and I will answer them all tonight.', true)], 'story gradient q&a'),
  tpl('Gradient story — lagoon', 'story', [storyGradient('lagoon', 'We moved!', 'Same team, new studio. Come say hi at 42 Harbour Street.', true)], 'story announcement'),
  tpl('Jazz night poster', 'poster', [eventPoster(P.noir, 'Live music', 'Late night jazz', 'Fri · Sept 12 · 9 PM', 'The Blue Room, Main St', 'bokeh-gold')], 'event music'),
  tpl('Design meetup poster', 'poster', [eventPoster(P.mono, 'Free entry', 'Design meetup', 'Thu · Oct 3 · 7 PM', 'Library Hall, 2nd floor', 'mesh-sunset')], 'event community'),
  tpl('Trail run poster', 'poster', [eventPoster(P.sage, '10K · 21K', 'Forest trail run', 'Sun · Apr 20 · 8 AM', 'Pine Ridge Park', 'hills')], 'event sport'),
  tpl('Minimal sunset poster', 'poster', [minimalPoster(P.terracotta, 'Slow days', 'An exhibition of quiet photographs from the coast', 'Gallery 9 · Through June')], 'art exhibition'),
  tpl('Minimal night poster', 'poster', [minimalPoster(P.midnight, 'After hours', 'A night market of food, books and records', 'Every Saturday · 6 PM')], 'market'),
  tpl('Minimal citrus poster', 'poster', [minimalPoster(P.sunshine, 'Fresh press', 'Cold juice, warm people. Now open on Elm Street.', 'Open 7 days')], 'business food'),
  tpl('Pitch deck — warm', 'presentation', presentation(P.terracotta, 'Q3 growth plan', 'Where we are, where we are going and what we need to get there.', 'mesh-sunset', ['Where we stand', 'What customers say', 'Our three bets', 'Next 90 days']), 'presentation business'),
  tpl('Pitch deck — night', 'presentation', presentation(P.midnight, 'Product vision 2027', 'A calmer, faster product for teams who ship every day.', 'mesh-night', ['The problem', 'Our approach', 'Roadmap', 'The ask']), 'presentation startup'),
  tpl('Lesson slides — sage', 'presentation', presentation(P.sage, 'Intro to botany', 'Week 1: how plants eat light, drink water and talk to each other.', 'mesh-forest', ['Photosynthesis', 'Roots & water', 'Leaves', 'Quiz']), 'presentation education'),
  tpl('Report slides — ocean', 'presentation', presentation(P.ocean, 'Annual impact report', 'Twelve months of clean-water projects in numbers and stories.', 'sea', ['Highlights', 'Projects', 'Finances', 'Thank you']), 'presentation report'),
  tpl('Recipe thumbnail', 'thumbnail', [thumbnail(P.sunshine, '5-minute pasta hack', 'mesh-sunset', 'EASY!')], 'youtube food'),
  tpl('Tech review thumbnail', 'thumbnail', [thumbnail(P.midnight, 'Is it worth it?', 'mesh-ocean', 'NEW')], 'youtube tech'),
  tpl('Travel vlog thumbnail', 'thumbnail', [thumbnail(P.ocean, 'I lived on a boat', 'sea', 'DAY 1')], 'youtube travel'),
  tpl('Studio business card', 'card', bizCard(P.terracotta, 'Alex Morgan', 'Creative director', ['alex@studio.com', '+1 555 010 2030', 'studio.com']), 'business card'),
  tpl('Night business card', 'card', bizCard(P.midnight, 'Sam Rivera', 'Software engineer', ['sam@devmail.io', 'github.com/sam', 'Berlin, DE']), 'business card'),
  tpl('Garden business card', 'card', bizCard(P.sage, 'Jordan Lee', 'Landscape architect', ['jordan@greenline.co', '+44 20 7946 0000', 'greenline.co']), 'business card'),
  tpl('Bakery logo', 'logo', [logo(P.terracotta, 'Crumb & Co', 'arch', 'Bakery · Est. 2026')], 'logo food'),
  tpl('Tech logo', 'logo', [logo(P.midnight, 'Nimbus', 'hexagon', 'Cloud tools')], 'logo tech'),
  tpl('Florist logo', 'logo', [logo(P.candy, 'Petal', 'flower', 'Florist & gifts')], 'logo shop'),
  tpl('Studio logo', 'logo', [logo(P.mono, 'NORTH', 'square', 'Design studio')], 'logo minimal'),
  tpl('Wedding invitation', 'invitation', [invitation(P.sage, 'Together with their families', 'Maya & Theo', 'Saturday, June 14, 2026', 'The Old Orchard\n4 PM ceremony · dinner to follow', 'leaf')], 'wedding invitation'),
  tpl('Birthday invitation', 'invitation', [invitation(P.candy, "You're invited to", "Lia's 30th", 'Friday, March 6 · 8 PM', 'Rooftop at 12 Park Lane\nDress code: sparkle', 'balloon')], 'birthday party'),
  tpl('Baby shower invitation', 'invitation', [invitation(P.ocean, 'Please join us for a', 'Baby shower', 'Sunday, May 18 · 1 PM', 'Our place · 88 Cedar Ave\nBrunch & games', 'cloud')], 'baby party'),
  tpl('Gala invitation', 'invitation', [invitation(P.noir, 'An evening of', 'Winter gala', 'December 20 · 7 PM', 'The Grand Hall\nBlack tie', 'crown')], 'formal event'),
  tpl('Classic resume', 'resume', [resume(P.terracotta, 'Riley Chen', 'Brand designer')], 'resume cv job'),
  tpl('Modern resume', 'resume', [resume(P.ocean, 'Taylor Brooks', 'Product manager')], 'resume cv'),
  tpl('Fresh resume', 'resume', [resume(P.sage, 'Morgan Diaz', 'Marketing lead')], 'resume cv'),
  tpl('Cleaning service flyer', 'flyer', [flyer(P.ocean, 'Sparkle home cleaning', 'Reliable, eco-friendly cleaning for homes and small offices.', ['Eco products', 'Insured staff', 'Same-day'], 'mesh-ocean')], 'flyer business service'),
  tpl('Yoga studio flyer', 'flyer', [flyer(P.sage, 'Morning yoga club', 'Gentle classes for every body. First week free.', ['All levels', 'Small groups', 'Tea after'], 'hills')], 'flyer fitness'),
  tpl('Food truck flyer', 'flyer', [flyer(P.sunshine, 'Taco Tuesday', 'Street tacos, fresh salsa and cold drinks at the park.', ['Vegan options', 'Local corn', 'Live DJ'], 'stripes')], 'flyer food'),
  tpl('Podcast banner', 'banner', [banner(P.midnight, 'The Late Shift', 'A podcast about makers, misfits and side projects', 'bokeh-blue')], 'banner header podcast'),
  tpl('Shop banner', 'banner', [banner(P.terracotta, 'Handmade ceramics', 'Small batches · shipped worldwide', 'terrazzo')], 'banner shop'),
  tpl('Coach banner', 'banner', [banner(P.sage, 'Grow with Jo', 'Career coaching for quiet leaders', 'mesh-forest')], 'banner personal'),
  tpl('Bistro menu', 'poster', [menu(P.sage, 'Little Fern', [['Starters', [['Charred leeks, hazelnut', '9'], ['Burrata & peach', '12'], ['Soup of the day', '7']]], ['Mains', [['Wild mushroom risotto', '18'], ['Roast chicken, greens', '21'], ['Market fish, lemon butter', '24']]], ['Sweets', [['Olive oil cake', '8'], ['Dark chocolate pot', '9']]]])], 'menu restaurant food'),
  tpl('Cafe menu', 'poster', [menu(P.terracotta, 'Morning Ritual', [['Coffee', [['Espresso', '3'], ['Flat white', '4.5'], ['Oat latte', '5']]], ['Bakery', [['Butter croissant', '3.5'], ['Cardamom bun', '4'], ['Banana bread', '4']]], ['Brunch', [['Avocado toast', '11'], ['Shakshuka', '13']]]])], 'menu cafe'),
  tpl('Achievement certificate', 'certificate', [certificate(P.noir, 'Certificate of achievement', 'Jamie Rivers')], 'certificate award'),
  tpl('Course certificate', 'certificate', [certificate(P.ocean, 'Certificate of completion', 'Avery Kim')], 'certificate education'),
  tpl('Wide quote — dunes', 'wide', [wideQuote(P.sunshine, 'The best views come after the hardest climbs.', 'dunes')], 'quote wide'),
  tpl('Wide quote — marble', 'wide', [wideQuote(P.noir, 'Simplicity is a kind of luxury.', 'marble')], 'quote wide'),
  tpl('Product promo', 'portrait', [portraitPromo(P.candy, 'Meet the cloud candle', 'From $24', 'mesh-candy')], 'product shop'),
  tpl('Course promo', 'portrait', [portraitPromo(P.midnight, 'Learn to paint with light', 'Enroll — $49', 'bokeh-gold')], 'course education'),
  tpl('Plant shop promo', 'portrait', [portraitPromo(P.sage, 'New greens just arrived', 'Pots from $12', 'mesh-forest')], 'shop plants'),
];

export const TEMPLATE_CATEGORIES = ['All', ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];
