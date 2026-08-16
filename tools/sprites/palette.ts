// Фиксированная палитра дарк-фентези: ровно 16 цветов.
// Все спрайты и тайлы рисуются ТОЛЬКО этими символами (+ '.' = прозрачно).
// Плейсхолдеры A/C/D существуют только в исходных матрицах котов и
// обязаны быть заменены recolor()-картой класса до рендера.

export const COLORS = {
  night: '#0d0a14', // почти чёрный пурпур — фон, глубокие тени
  plum: '#1f1833', // тёмная слива — земля, тёмный мех
  slate: '#2e2b45', // холодный серо-синий — камень тёмный
  stone: '#4a4462', // камень светлее — стены, серый мех
  fog: '#6f6c8a', // туман — блики камня
  bone: '#a89f94', // кость — черепа, рукояти
  paleBone: '#d8cfc0', // светлая кость — клинки, блики
  blood: '#8c2233', // кровь
  ember: '#c96b2e', // тлеющий уголь — огонь, рыжий мех
  cursedGreen: '#3e7a4e', // проклятая зелень — трава, слизь
  gold: '#c9a227', // болезненное золото — UI, глаза
  cyan: '#4fa4b8', // спектральный циан — магия, призраки
  deepBlue: '#2b4a78', // глубокий синий
  violet: '#6b3fa0', // магический фиолет
  flesh: '#b06a6a', // плоть — носы, раны
  white: '#f2ede4', // почти белый — глаза, вспышки
} as const;

export type ColorName = keyof typeof COLORS;

// Символ пикселя → цвет палитры
export const CHARS: Record<string, ColorName> = {
  '0': 'night',
  '1': 'plum',
  '2': 'slate',
  '3': 'stone',
  'f': 'fog',
  'b': 'bone',
  'B': 'paleBone',
  'r': 'blood',
  'o': 'ember',
  'g': 'cursedGreen',
  'y': 'gold',
  'c': 'cyan',
  'u': 'deepBlue',
  'v': 'violet',
  'p': 'flesh',
  'w': 'white',
};

export function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}
