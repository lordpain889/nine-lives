import { PNG } from 'pngjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { CHARS, COLORS, hexToRgb } from './palette';

// Матрица спрайта: массив строк, один символ = один пиксель, '.' = прозрачно.
export type Matrix = string[];

export function assertSize(m: Matrix, w: number, h: number, name: string): void {
  if (m.length !== h) {
    throw new Error(`${name}: ${m.length} rows, expected ${h}`);
  }
  m.forEach((row, i) => {
    if (row.length !== w) {
      throw new Error(`${name} row ${i}: ${row.length} chars ("${row}"), expected ${w}`);
    }
  });
}

export function blank(w: number, h: number): Matrix {
  return Array.from({ length: h }, () => '.'.repeat(w));
}

export function fill(w: number, h: number, ch: string): Matrix {
  return Array.from({ length: h }, () => ch.repeat(w));
}

// Заменить символы по карте (плейсхолдеры класса → символы палитры).
export function recolor(m: Matrix, map: Record<string, string>): Matrix {
  return m.map((row) =>
    row
      .split('')
      .map((ch) => map[ch] ?? ch)
      .join(''),
  );
}

// Наложить over поверх base: непрозрачные пиксели over побеждают.
export function overlay(base: Matrix, over: Matrix): Matrix {
  return base.map((row, y) =>
    row
      .split('')
      .map((ch, x) => (over[y]?.[x] && over[y][x] !== '.' ? over[y][x] : ch))
      .join(''),
  );
}

export function mirrorH(m: Matrix): Matrix {
  return m.map((row) => row.split('').reverse().join(''));
}

// Заменить отдельные строки (для вариантов анимации).
export function editRows(m: Matrix, edits: Record<number, string>): Matrix {
  return m.map((row, i) => edits[i] ?? row);
}

// Сдвиг содержимого на dx/dy пикселей (выпавшее отбрасывается).
export function shift(m: Matrix, dx: number, dy: number): Matrix {
  const h = m.length;
  const w = m[0].length;
  const out = blank(w, h).map((r) => r.split(''));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = m[y][x];
      if (ch === '.') continue;
      const ny = y + dy;
      const nx = x + dx;
      if (ny >= 0 && ny < h && nx >= 0 && nx < w) out[ny][nx] = ch;
    }
  }
  return out.map((r) => r.join(''));
}

// Поставить отдельные пиксели: список [x, y, char].
export function setPixels(m: Matrix, pixels: Array<[number, number, string]>): Matrix {
  const rows = m.map((r) => r.split(''));
  for (const [x, y, ch] of pixels) {
    if (y < 0 || y >= rows.length || x < 0 || x >= rows[0].length) {
      throw new Error(`setPixels: (${x},${y}) out of bounds`);
    }
    rows[y][x] = ch;
  }
  return rows.map((r) => r.join(''));
}

// Собрать кадры в спрайтшит и записать PNG (детерминированно).
export function writeSheet(
  path: string,
  frames: Matrix[],
  frameW: number,
  frameH: number,
  columns: number = frames.length,
): void {
  frames.forEach((f, i) => assertSize(f, frameW, frameH, `${path} frame ${i}`));
  const rows = Math.ceil(frames.length / columns);
  const png = new PNG({ width: columns * frameW, height: rows * frameH });
  // PNG инициализируется нулями = прозрачный фон.
  frames.forEach((frame, idx) => {
    const ox = (idx % columns) * frameW;
    const oy = Math.floor(idx / columns) * frameH;
    for (let y = 0; y < frameH; y++) {
      for (let x = 0; x < frameW; x++) {
        const ch = frame[y][x];
        if (ch === '.') continue;
        const colorName = CHARS[ch];
        if (!colorName) {
          throw new Error(`${path} frame ${idx}: unknown pixel char "${ch}" at ${x},${y} (незаменённый плейсхолдер?)`);
        }
        const [r, g, b] = hexToRgb(COLORS[colorName]);
        const pos = ((oy + y) * png.width + (ox + x)) * 4;
        png.data[pos] = r;
        png.data[pos + 1] = g;
        png.data[pos + 2] = b;
        png.data[pos + 3] = 255;
      }
    }
  });
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, PNG.sync.write(png));
  console.log(`${path}: ${frames.length} frames (${columns}x${rows} grid, ${frameW}x${frameH})`);
}
