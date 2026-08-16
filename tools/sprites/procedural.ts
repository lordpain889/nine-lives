import { PNG } from 'pngjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { COLORS, hexToRgb } from './palette';

// Процедурные текстуры (виньетка, туман, свечение) — тоже детерминированные:
// сид фиксирован, Math.random не используется.

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function writePixels(
  path: string,
  w: number,
  h: number,
  fn: (x: number, y: number) => [number, number, number, number],
): void {
  const png = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = fn(x, y);
      const p = (y * w + x) * 4;
      png.data[p] = r;
      png.data[p + 1] = g;
      png.data[p + 2] = b;
      png.data[p + 3] = a;
    }
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, PNG.sync.write(png));
  console.log(`${path}: ${w}x${h} procedural`);
}

// Виньетка 320x180: прозрачный центр → тёмные края
export function vignette(path: string): void {
  const [nr, ng, nb] = hexToRgb(COLORS.night);
  writePixels(path, 320, 180, (x, y) => {
    const dx = (x - 160) / 176;
    const dy = (y - 90) / 104;
    const d = Math.sqrt(dx * dx + dy * dy);
    const t = Math.max(0, d - 0.55) / 0.55;
    const alpha = Math.min(1, t * t * 1.4) * 200;
    return [nr, ng, nb, Math.round(alpha)];
  });
}

// Тайлящийся value-noise туман 256x256 (2 октавы, билинейная интерполяция)
export function fog(path: string): void {
  const rand = mulberry32(900913);
  const SIZE = 256;
  const lattice = (cells: number) => {
    const g: number[][] = [];
    for (let y = 0; y < cells; y++) {
      g.push(Array.from({ length: cells }, () => rand()));
    }
    return (x: number, y: number) => {
      const cw = SIZE / cells;
      const gx = x / cw;
      const gy = y / cw;
      const x0 = Math.floor(gx) % cells;
      const y0 = Math.floor(gy) % cells;
      const x1 = (x0 + 1) % cells;
      const y1 = (y0 + 1) % cells;
      const fx = gx - Math.floor(gx);
      const fy = gy - Math.floor(gy);
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const top = g[y0][x0] * (1 - sx) + g[y0][x1] * sx;
      const bot = g[y1][x0] * (1 - sx) + g[y1][x1] * sx;
      return top * (1 - sy) + bot * sy;
    };
  };
  const o1 = lattice(8);
  const o2 = lattice(16);
  const [fr, fg, fb] = hexToRgb(COLORS.fog);
  writePixels(path, SIZE, SIZE, (x, y) => {
    const v = o1(x, y) * 0.65 + o2(x, y) * 0.35;
    const alpha = Math.round(Math.max(0, v - 0.35) * 255);
    return [fr, fg, fb, alpha];
  });
}

// Мягкое круглое свечение 64x64 (белое — красится setTint, ADD blend)
export function glow(path: string): void {
  writePixels(path, 64, 64, (x, y) => {
    const dx = (x - 32) / 32;
    const dy = (y - 32) / 32;
    const d = Math.min(1, Math.sqrt(dx * dx + dy * dy));
    const alpha = Math.round((1 - d) * (1 - d) * 160);
    return [242, 237, 228, alpha];
  });
}

// Точка-частица 3x3
export function particleDot(path: string): void {
  writePixels(path, 3, 3, (x, y) => {
    const on = x === 1 || y === 1;
    return [242, 237, 228, on ? 255 : 90];
  });
}
