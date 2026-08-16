import Phaser from 'phaser';
import {
  FONT_CHARSET,
  FONT_CHARS_PER_ROW,
  FONT_CELL_W,
  FONT_CELL_H,
} from '../../tools/sprites/defs/fontCharset';

// Пиксельный bitmap-шрифт: один регистр, кириллица+латиница+цифры.
// Все игровые тексты — через uiText / setUiText (нормализация капсом).

export const FONT_KEY = 'px';

export const UI = {
  gold: 0xc9a227,
  bone: 0xd8cfc0,
  fog: 0x6f6c8a,
  blood: 0x8c2233,
  cyan: 0x4fa4b8,
  white: 0xf2ede4,
  green: 0x3e7a4e,
  ember: 0xc96b2e,
} as const;

export function registerFont(scene: Phaser.Scene): void {
  if (scene.cache.bitmapFont.exists(FONT_KEY)) return;
  const data = Phaser.GameObjects.RetroFont.Parse(scene, {
    image: 'font',
    width: FONT_CELL_W,
    height: FONT_CELL_H,
    chars: FONT_CHARSET,
    charsPerRow: FONT_CHARS_PER_ROW,
    'spacing.x': 0,
    'spacing.y': 0,
    lineSpacing: 2,
    'offset.x': 0,
    'offset.y': 0,
  });
  scene.cache.bitmapFont.add(FONT_KEY, data);
}

const KNOWN = new Set(FONT_CHARSET.split(''));

export function normalize(text: string): string {
  return text
    .toUpperCase()
    .replace(/Ё/g, 'Е')
    .replace(/—/g, '-')
    .split('')
    .map((ch) => (KNOWN.has(ch) || ch === '\n' ? ch : '?'))
    .join('');
}

export function uiText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  tint: number = UI.bone,
  scale = 1,
): Phaser.GameObjects.BitmapText {
  return scene.add.bitmapText(x, y, FONT_KEY, normalize(text)).setTint(tint).setScale(scale);
}

export function setUiText(t: Phaser.GameObjects.BitmapText, text: string): void {
  t.setText(normalize(text));
}
