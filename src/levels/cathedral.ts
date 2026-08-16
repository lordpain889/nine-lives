import { TILES, CRYPT_TILES } from '../config/gameData';
import type { ZoneDef } from '../types';

// Чумной собор 36x24 — арена Кардинала. Шахматный пол, колонны, витражи.

const W = 36;
const H = 24;

function buildCathedral(): { ground: number[][]; decor: number[][] } {
  const m: number[][] = [];
  for (let y = 0; y < H; y++) {
    const row: number[] = [];
    for (let x = 0; x < W; x++) {
      row.push(((x >> 1) + (y >> 1)) % 2 === 0 ? CRYPT_TILES.checkerA : CRYPT_TILES.checkerB);
    }
    m.push(row);
  }
  const hline = (x1: number, x2: number, y: number, t: number) => {
    for (let x = x1; x <= x2; x++) m[y][x] = t;
  };
  const vline = (x: number, y1: number, y2: number, t: number) => {
    for (let y = y1; y <= y2; y++) m[y][x] = t;
  };

  // стены
  hline(0, W - 1, 0, CRYPT_TILES.brick);
  hline(0, W - 1, H - 1, CRYPT_TILES.brick);
  vline(0, 0, H - 1, CRYPT_TILES.brick);
  vline(W - 1, 0, H - 1, CRYPT_TILES.brick);

  // витражи на северной стене
  for (const x of [6, 12, 18, 24, 30]) m[0][x] = CRYPT_TILES.stained;

  // колоннады
  for (const y of [6, 12, 18]) {
    m[y][8] = CRYPT_TILES.pillar;
    m[y][27] = CRYPT_TILES.pillar;
  }

  // свечи у алтарной части
  m[4][14] = TILES.candle;
  m[4][21] = TILES.candle;

  // вход с юга
  hline(17, 19, H - 1, CRYPT_TILES.checkerA);

  const decor: number[][] = m.map((row) => row.map(() => -1));
  return { ground: m, decor };
}

export const cathedralZone: ZoneDef = {
  key: 'cathedral',
  nameRu: 'Чумной собор',
  buildMap: buildCathedral,
  spawns: [
    { type: 'player', x: 18, y: 21 },
    { type: 'cardinal', x: 18, y: 7 },
  ],
  exits: [{ x: 17, y: 23, w: 3, h: 1, toZone: 'catacombs', toX: 30, toY: 8 }],
  ambient: {
    bgColor: '#0d0a14',
    tint: { color: 0x6b3fa0, alpha: 0.12 },
    fogDensity: 1,
    particles: ['dust', 'embers'],
  },
};
