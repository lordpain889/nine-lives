import { join } from 'node:path';
import { Matrix, overlay, recolor, writeSheet } from './lib';
import {
  catBodyFrames,
  weaponOverlays,
  classRecolors,
  FRAMES_PER_CLASS,
  ATTACK_FRAME_START,
  ATTACK_FRAME_COUNT,
} from './defs/cats';
import { tileFrames } from './defs/tiles';
import { enemyFrames } from './defs/enemies';
import { uiFrames } from './defs/ui';
import { bossFrames } from './defs/boss';
import { buildFontFrames } from './defs/font';
import { FONT_CHARS_PER_ROW, FONT_CELL_W, FONT_CELL_H } from './defs/fontCharset';
import { itemFrames } from './defs/items';
import { npcFrames } from './defs/npcs';
import { vignette, fog, glow, particleDot } from './procedural';

const OUT = join(import.meta.dirname, '..', '..', 'public', 'assets');

// ── cats.png: ряд = класс, столбцы = кадры (индексы в CAT_FRAMES) ─────────
const catFrames: Matrix[] = [];
for (const { key, map } of classRecolors) {
  catBodyFrames.forEach((body, i) => {
    let frame = body;
    if (i >= ATTACK_FRAME_START && i < ATTACK_FRAME_START + ATTACK_FRAME_COUNT) {
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

// ── items.png: иконки предметов ───────────────────────────────────────────
writeSheet(join(OUT, 'items.png'), itemFrames, 16, 16);

// ── npcs.png: жители чумного города ───────────────────────────────────────
writeSheet(join(OUT, 'npcs.png'), npcFrames, 16, 16);

// ── процедурные текстуры атмосферы ────────────────────────────────────────
vignette(join(OUT, 'vignette.png'));
fog(join(OUT, 'fog.png'));
glow(join(OUT, 'glow.png'));
particleDot(join(OUT, 'particle.png'));

console.log('Done.');
