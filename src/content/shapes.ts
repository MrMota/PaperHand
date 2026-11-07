// Original shape library. Every path is authored on a 100×100 box.

function poly(n: number, rot = -90, r = 50, cx = 50, cy = 50) {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = ((rot + (360 / n) * i) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  });
  return `M${pts.join(' L')} Z`;
}

function star(points: number, inner: number, outer = 50) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((-90 + (180 / points) * i) * Math.PI) / 180;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}

function blob(seed: number, n = 8) {
  const rnd = (i: number) => {
    const x = Math.sin(seed * 999 + i * 77.7) * 10000;
    return x - Math.floor(x);
  };
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (Math.PI * 2 * i) / n;
    const r = 34 + rnd(i) * 16;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
  });
  // Catmull-Rom → cubic bezier for a smooth closed curve
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
}

export interface ShapeDef { id: string; name: string; d: string; tags: string }

export const SHAPES: ShapeDef[] = [
  { id: 'square', name: 'Square', d: 'M0 0 H100 V100 H0 Z', tags: 'rectangle box' },
  { id: 'rounded', name: 'Rounded square', d: 'M16 0 H84 Q100 0 100 16 V84 Q100 100 84 100 H16 Q0 100 0 84 V16 Q0 0 16 0 Z', tags: 'rectangle box round' },
  { id: 'circle', name: 'Circle', d: 'M50 0 A50 50 0 1 1 49.99 0 Z', tags: 'round ellipse dot' },
  { id: 'triangle', name: 'Triangle', d: 'M50 0 L100 100 H0 Z', tags: 'polygon' },
  { id: 'rtriangle', name: 'Right triangle', d: 'M0 0 L100 100 H0 Z', tags: 'polygon' },
  { id: 'diamond', name: 'Diamond', d: 'M50 0 L100 50 L50 100 L0 50 Z', tags: 'rhombus polygon' },
  { id: 'pentagon', name: 'Pentagon', d: poly(5), tags: 'polygon' },
  { id: 'hexagon', name: 'Hexagon', d: poly(6, 0), tags: 'polygon honeycomb' },
  { id: 'octagon', name: 'Octagon', d: poly(8, 22.5), tags: 'polygon stop' },
  { id: 'star5', name: 'Star', d: star(5, 21), tags: 'favourite rating' },
  { id: 'star4', name: 'Sparkle', d: 'M50 0 C54 36 64 46 100 50 C64 54 54 64 50 100 C46 64 36 54 0 50 C36 46 46 36 50 0 Z', tags: 'twinkle shine star' },
  { id: 'star8', name: 'Eight-point star', d: star(8, 32), tags: 'star' },
  { id: 'burst', name: 'Burst', d: star(16, 38), tags: 'badge seal sale' },
  { id: 'heart', name: 'Heart', d: 'M50 92 C20 70 0 52 0 30 C0 13 13 2 28 2 C38 2 46 8 50 16 C54 8 62 2 72 2 C87 2 100 13 100 30 C100 52 80 70 50 92 Z', tags: 'love' },
  { id: 'arrow', name: 'Arrow', d: 'M0 35 H60 V12 L100 50 L60 88 V65 H0 Z', tags: 'direction right' },
  { id: 'arrow2', name: 'Double arrow', d: 'M0 50 L28 18 V36 H72 V18 L100 50 L72 82 V64 H28 V82 Z', tags: 'direction both' },
  { id: 'chevron', name: 'Chevron', d: 'M0 0 H62 L100 50 L62 100 H0 L38 50 Z', tags: 'arrow step' },
  { id: 'plus', name: 'Plus', d: 'M35 0 H65 V35 H100 V65 H65 V100 H35 V65 H0 V35 H35 Z', tags: 'cross add' },
  { id: 'bubble', name: 'Speech bubble', d: 'M12 0 H88 Q100 0 100 12 V62 Q100 74 88 74 H40 L18 96 L22 74 H12 Q0 74 0 62 V12 Q0 0 12 0 Z', tags: 'chat talk' },
  { id: 'cloud', name: 'Cloud', d: 'M25 85 C10 85 0 75 0 62 C0 50 9 41 21 40 C22 24 35 12 51 12 C64 12 75 20 79 32 C91 33 100 43 100 56 C100 72 89 85 74 85 Z', tags: 'weather sky' },
  { id: 'moon', name: 'Crescent', d: 'M62 2 C36 8 20 30 20 52 C20 76 40 96 64 98 C46 100 22 92 10 72 C-4 48 6 16 32 4 C42 0 52 0 62 2 Z', tags: 'night moon' },
  { id: 'ring', name: 'Ring', d: 'M50 0 A50 50 0 1 1 49.99 0 Z M50 22 A28 28 0 1 0 50.01 22 Z', tags: 'donut circle' },
  { id: 'semicircle', name: 'Half circle', d: 'M0 75 A50 50 0 0 1 100 75 Z', tags: 'arch' },
  { id: 'arch', name: 'Arch', d: 'M0 100 V50 A50 50 0 0 1 100 50 V100 Z', tags: 'window door' },
  { id: 'quarter', name: 'Quarter circle', d: 'M0 0 A100 100 0 0 1 100 100 H0 Z', tags: 'pie' },
  { id: 'parallelogram', name: 'Parallelogram', d: 'M25 0 H100 L75 100 H0 Z', tags: 'slant' },
  { id: 'trapezoid', name: 'Trapezoid', d: 'M22 0 H78 L100 100 H0 Z', tags: 'polygon' },
  { id: 'drop', name: 'Drop', d: 'M50 0 C70 30 88 48 88 66 C88 87 71 100 50 100 C29 100 12 87 12 66 C12 48 30 30 50 0 Z', tags: 'water tear' },
  { id: 'shield', name: 'Shield', d: 'M50 0 L95 14 V48 C95 74 75 92 50 100 C25 92 5 74 5 48 V14 Z', tags: 'badge security' },
  { id: 'ticket', name: 'Ticket', d: 'M0 0 H100 V38 A12 12 0 0 0 100 62 V100 H0 V62 A12 12 0 0 0 0 38 Z', tags: 'coupon' },
  { id: 'flower', name: 'Flower', d: 'M50 22 C50 6 66 0 72 12 C80 0 98 10 88 26 C102 30 100 50 86 52 C98 64 86 82 72 76 C70 92 50 98 50 80 C50 98 30 92 28 76 C14 82 2 64 14 52 C0 50 -2 30 12 26 C2 10 20 0 28 12 C34 0 50 6 50 22 Z', tags: 'petal scallop' },
  { id: 'blob1', name: 'Blob', d: blob(1), tags: 'organic' },
  { id: 'blob2', name: 'Blob 2', d: blob(2, 7), tags: 'organic' },
  { id: 'blob3', name: 'Blob 3', d: blob(5, 9), tags: 'organic' },
  { id: 'blob4', name: 'Blob 4', d: blob(11, 6), tags: 'organic' },
];

export interface LineDef { id: string; name: string; dash?: number[]; arrowEnd?: boolean; arrowStart?: boolean; width: number; cap?: 'round' | 'butt' }

export const LINES: LineDef[] = [
  { id: 'solid', name: 'Line', width: 6 },
  { id: 'thick', name: 'Thick line', width: 16 },
  { id: 'dashed', name: 'Dashed', width: 6, dash: [24, 14] },
  { id: 'dotted', name: 'Dotted', width: 8, dash: [0, 18], cap: 'round' },
  { id: 'arrow', name: 'Arrow', width: 6, arrowEnd: true },
  { id: 'darrow', name: 'Double arrow', width: 6, arrowEnd: true, arrowStart: true },
  { id: 'darrowdash', name: 'Dashed arrow', width: 6, arrowEnd: true, dash: [20, 12] },
];

export const FRAMES = SHAPES.filter((s) =>
  ['square', 'rounded', 'circle', 'arch', 'heart', 'star5', 'hexagon', 'blob1', 'blob3', 'diamond', 'drop', 'flower', 'triangle', 'ticket'].includes(s.id),
);
