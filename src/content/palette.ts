export type GradientSpec = { type: 'linear' | 'radial'; angle?: number; stops: [number, string][] };
export type FillSpec = string | GradientSpec;

export const GRADIENTS: { id: string; name: string; g: GradientSpec }[] = [
  { id: 'ember', name: 'Ember', g: { type: 'linear', angle: 135, stops: [[0, '#F9D976'], [1, '#F39F86']] } },
  { id: 'dusk', name: 'Dusk', g: { type: 'linear', angle: 135, stops: [[0, '#2B1B3F'], [0.5, '#8E3B6E'], [1, '#F2846B']] } },
  { id: 'lagoon', name: 'Lagoon', g: { type: 'linear', angle: 135, stops: [[0, '#43C6AC'], [1, '#191654']] } },
  { id: 'mint', name: 'Mint', g: { type: 'linear', angle: 160, stops: [[0, '#D4FC79'], [1, '#96E6A1']] } },
  { id: 'peach', name: 'Peach', g: { type: 'linear', angle: 120, stops: [[0, '#FFECD2'], [1, '#FCB69F']] } },
  { id: 'iris', name: 'Iris', g: { type: 'linear', angle: 135, stops: [[0, '#A18CD1'], [1, '#FBC2EB']] } },
  { id: 'ocean', name: 'Ocean', g: { type: 'linear', angle: 180, stops: [[0, '#2E8BC0'], [1, '#0C2D48']] } },
  { id: 'citrus', name: 'Citrus', g: { type: 'linear', angle: 90, stops: [[0, '#F7971E'], [1, '#FFD200']] } },
  { id: 'forest', name: 'Forest', g: { type: 'linear', angle: 150, stops: [[0, '#5A8F29'], [1, '#1D3B1A']] } },
  { id: 'rose', name: 'Rose', g: { type: 'linear', angle: 135, stops: [[0, '#F8C8D0'], [1, '#E4577A']] } },
  { id: 'steel', name: 'Steel', g: { type: 'linear', angle: 180, stops: [[0, '#E6E9F0'], [1, '#B8C1D1']] } },
  { id: 'night', name: 'Night', g: { type: 'linear', angle: 180, stops: [[0, '#141E30'], [1, '#243B55']] } },
  { id: 'glow', name: 'Glow', g: { type: 'radial', stops: [[0, '#FFF6D6'], [1, '#F2A33A']] } },
  { id: 'aura', name: 'Aura', g: { type: 'radial', stops: [[0, '#FBC2EB'], [0.6, '#A18CD1'], [1, '#3D2C6B']] } },
  { id: 'sand', name: 'Sand', g: { type: 'linear', angle: 180, stops: [[0, '#F5E6CC'], [1, '#D9B98C']] } },
  { id: 'neon', name: 'Neon', g: { type: 'linear', angle: 120, stops: [[0, '#00F5A0'], [1, '#00D9F5']] } },
];

export const SWATCHES = [
  '#000000', '#3B3833', '#6E6A63', '#A8A39A', '#D9D5CD', '#FFFFFF',
  '#B42318', '#E4572E', '#F29E4C', '#F2B632', '#F7E27A', '#3BB273',
  '#1E7F5C', '#2E8BC0', '#1D4E89', '#5B3FA6', '#9C6ADE', '#E4577A',
  '#F8C8D0', '#FBE9DF', '#E8F3EC', '#E3EEF8', '#EDE6F7', '#2B1B3F',
];
