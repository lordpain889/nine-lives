import { join } from 'node:path';
import { Matrix, overlay, recolor, writeSheet } from './lib';
import { catBodyFrames, weaponOverlays, classRecolors, FRAMES_PER_CLASS } from './defs/cats';
import { tileFrames } from './defs/tiles';
import { enemyFrames } from './defs/enemies';
import { uiFrames } from './defs/ui';
import { bossFrames } from './defs/boss';
import { buildFontFrames } from './defs/font';
import { FONT_CHARS_PER_ROW, FONT_CELL_W, FONT_CELL_H } from './defs/fontCharset';

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

// ── ui.png: пламя алтаря, рыбья кость, фляга ──────────────────────────────
writeSheet(join(OUT, 'ui.png'), uiFrames, 16, 16);

// ── boss.png: Graveyard Warden 32x32 ──────────────────────────────────────
writeSheet(join(OUT, 'boss.png'), bossFrames, 32, 32);

// ── font.png: пиксельный шрифт 5×7 (клетки 6×8) ───────────────────────────
writeSheet(join(OUT, 'font.png'), buildFontFrames(), FONT_CELL_W, FONT_CELL_H, FONT_CHARS_PER_ROW);

console.log('Done.');
