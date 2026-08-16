import { join } from 'node:path';
import { Matrix, overlay, recolor, writeSheet } from './lib';
import { catBodyFrames, weaponOverlays, classRecolors, FRAMES_PER_CLASS } from './defs/cats';
import { tileFrames } from './defs/tiles';
import { enemyFrames } from './defs/enemies';

const OUT = join(import.meta.dirname, '..', '..', 'public', 'assets');

// ── cats.png: ряд = класс, столбцы = кадры (индексы в CAT_FRAMES) ─────────
const ATTACK_FRAME_START = 10; // кадры 10-12 — атака, на них кладём оружие

const catFrames: Matrix[] = [];
for (const { key, map } of classRecolors) {
  catBodyFrames.forEach((body, i) => {
    let frame = body;
    if (i >= ATTACK_FRAME_START && i < ATTACK_FRAME_START + 3) {
      frame = overlay(frame, weaponOverlays[key][i - ATTACK_FRAME_START]);
    }
    catFrames.push(recolor(frame, map));
  });
}
writeSheet(join(OUT, 'cats.png'), catFrames, 16, 16, FRAMES_PER_CLASS);

// ── tiles.png: один ряд ───────────────────────────────────────────────────
writeSheet(join(OUT, 'tiles.png'), tileFrames, 16, 16);

// ── enemies.png: один ряд (гончая, аколит, снаряды) ───────────────────────
writeSheet(join(OUT, 'enemies.png'), enemyFrames, 16, 16);

console.log('Done.');
