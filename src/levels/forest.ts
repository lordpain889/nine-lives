import { TILES, DECOR, FOREST_TILES } from '../config/gameData';
import type { ZoneDef } from '../types';

// Проклятый лес 64x44: густые кроны, поляны, волчьи стаи и духи.
// Коридоры гарантируют проход: горизонталь y20-24, вертикаль x28-34.

const W = 64;
const H = 44;

const CLEARINGS: Array<[number, number, number]> = [
  [58, 22, 5], //  вход с востока
  [32, 22, 7], //  центральная поляна с алтарём
  [16, 15, 5], //  волчье логово
  [45, 12, 5],
  [44, 30, 5],
  [20, 33, 5],
  [30, 10, 4], //  духи
  [50, 22, 4],
  [12, 28, 4],
];

function buildForest(): { ground: number[][]; decor: number[][] } {
  const m: number[][] = [];
  for (let y = 0; y < H; y++) {
    const row: number[] = [];
    for (let x = 0; x < W; x++) {
      row.push((x * 7 + y * 13) % 5 === 0 ? TILES.grassB : TILES.grassA);
    }
    m.push(row);
  }

  const inClearing = (x: number, y: number) =>
    CLEARINGS.some(([cx, cy, r]) => (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r);
  const inCorridor = (x: number, y: number) =>
    (y >= 20 && y <= 24) || (x >= 28 && x <= 34 && y >= 8 && y <= 36);

  // чаща: плотный детерминированный скаттер вне полян и коридоров
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const border = x < 2 || y < 2 || x >= W - 2 || y >= H - 2;
      const h = (x * 2654435761 + y * 40503) % 100;
      if (border || (!inClearing(x, y) && !inCorridor(x, y) && h < 38)) {
        m[y][x] = FOREST_TILES.denseTree;
      }
    }
  }

  // проход к городу на востоке
  for (const y of [21, 22, 23]) {
    m[y][W - 1] = TILES.dirt;
    m[y][W - 2] = TILES.dirt;
  }

  // пни и грибы по полянам
  const stumps: Array<[number, number]> = [[18, 13], [43, 14], [22, 31], [46, 28], [30, 24]];
  for (const [x, y] of stumps) m[y][x] = FOREST_TILES.stump;
  const shrooms: Array<[number, number]> = [[29, 9], [51, 21], [11, 27], [33, 20], [14, 16], [45, 31]];
  for (const [x, y] of shrooms) m[y][x] = FOREST_TILES.bigShroom;

  // алтарь на центральной поляне
  m[22][32] = TILES.shrineBase;

  // decor: густая трава и кости
  const decor: number[][] = m.map((row) => row.map(() => -1));
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const g = m[y][x];
      if (g !== TILES.grassA && g !== TILES.grassB) continue;
      const h = (x * 48271 + y * 16807) % 100;
      if (h < 9) decor[y][x] = [DECOR.tuftA, DECOR.tuftB, DECOR.shrooms, DECOR.bones][h % 4];
    }
  }
  return { ground: m, decor };
}

export const forestZone: ZoneDef = {
  key: 'forest',
  nameRu: 'Проклятый лес',
  buildMap: buildForest,
  spawns: [
    { type: 'player', x: 60, y: 22 },
    { type: 'shrine', x: 32, y: 22 },
    { type: 'wolf', x: 15, y: 15 },
    { type: 'wolf', x: 17, y: 16 },
    { type: 'wolf', x: 45, y: 12 },
    { type: 'wolf', x: 44, y: 30 },
    { type: 'wolf', x: 20, y: 33 },
    { type: 'spirit', x: 30, y: 10 },
    { type: 'spirit', x: 50, y: 22 },
    { type: 'spirit', x: 12, y: 28 },
  ],
  exits: [{ x: 63, y: 21, w: 1, h: 3, toZone: 'town', toX: 2, toY: 17 }],
  ambient: {
    bgColor: '#0d0a14',
    tint: { color: 0x3e7a4e, alpha: 0.12 },
    fogDensity: 2,
    particles: ['dust', 'fireflies', 'leaves'],
  },
};
