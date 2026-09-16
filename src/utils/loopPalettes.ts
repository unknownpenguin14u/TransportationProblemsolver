// Curated vibrant color palettes for multiple non-basic cell stepping stone polygons
export interface LoopPalette {
  id: string;
  name: string;
  stroke: string;
  fill: string;
  glow: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  rowHighlightBg: string;
  borderAccent: string;
}

export const LOOP_PALETTES: LoopPalette[] = [
  {
    id: 'indigo',
    name: 'Indigo',
    stroke: '#4f46e5', // indigo-600
    fill: 'rgba(79, 70, 229, 0.12)',
    glow: 'rgba(79, 70, 229, 0.3)',
    badgeBg: '#4f46e5',
    badgeBorder: '#818cf8',
    badgeText: '#ffffff',
    rowHighlightBg: 'bg-indigo-50/90',
    borderAccent: 'border-indigo-500',
  },
  {
    id: 'purple',
    name: 'Violet',
    stroke: '#9333ea', // purple-600
    fill: 'rgba(147, 51, 234, 0.12)',
    glow: 'rgba(147, 51, 234, 0.3)',
    badgeBg: '#9333ea',
    badgeBorder: '#c084fc',
    badgeText: '#ffffff',
    rowHighlightBg: 'bg-purple-50/90',
    borderAccent: 'border-purple-500',
  },
  {
    id: 'rose',
    name: 'Rose',
    stroke: '#e11d48', // rose-600
    fill: 'rgba(225, 29, 72, 0.12)',
    glow: 'rgba(225, 29, 72, 0.3)',
    badgeBg: '#e11d48',
    badgeBorder: '#fb7185',
    badgeText: '#ffffff',
    rowHighlightBg: 'bg-rose-50/90',
    borderAccent: 'border-rose-500',
  },
  {
    id: 'amber',
    name: 'Amber',
    stroke: '#d97706', // amber-600
    fill: 'rgba(217, 119, 6, 0.12)',
    glow: 'rgba(217, 119, 6, 0.3)',
    badgeBg: '#d97706',
    badgeBorder: '#fcd34d',
    badgeText: '#ffffff',
    rowHighlightBg: 'bg-amber-50/90',
    borderAccent: 'border-amber-500',
  },
  {
    id: 'teal',
    name: 'Teal',
    stroke: '#0d9488', // teal-600
    fill: 'rgba(13, 148, 136, 0.12)',
    glow: 'rgba(13, 148, 136, 0.3)',
    badgeBg: '#0d9488',
    badgeBorder: '#5eead4',
    badgeText: '#ffffff',
    rowHighlightBg: 'bg-teal-50/90',
    borderAccent: 'border-teal-500',
  },
  {
    id: 'cyan',
    name: 'Cyan',
    stroke: '#0891b2', // cyan-600
    fill: 'rgba(8, 145, 178, 0.12)',
    glow: 'rgba(8, 145, 178, 0.3)',
    badgeBg: '#0891b2',
    badgeBorder: '#67e8f9',
    badgeText: '#ffffff',
    rowHighlightBg: 'bg-cyan-50/90',
    borderAccent: 'border-cyan-500',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    stroke: '#059669', // emerald-600
    fill: 'rgba(5, 150, 105, 0.12)',
    glow: 'rgba(5, 150, 105, 0.3)',
    badgeBg: '#059669',
    badgeBorder: '#6ee7b7',
    badgeText: '#ffffff',
    rowHighlightBg: 'bg-emerald-50/90',
    borderAccent: 'border-emerald-500',
  },
  {
    id: 'fuchsia',
    name: 'Fuchsia',
    stroke: '#c026d3', // fuchsia-600
    fill: 'rgba(192, 38, 211, 0.12)',
    glow: 'rgba(192, 38, 211, 0.3)',
    badgeBg: '#c026d3',
    badgeBorder: '#f0abfc',
    badgeText: '#ffffff',
    rowHighlightBg: 'bg-fuchsia-50/90',
    borderAccent: 'border-fuchsia-500',
  },
];

export function getPaletteForIndex(index: number): LoopPalette {
  return LOOP_PALETTES[index % LOOP_PALETTES.length];
}
