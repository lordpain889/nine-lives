import { TILES } from '../config/gameData';
import type { SpawnPoint } from '../types';

// Кладбище — единственная зона MVP. 60x40 тайлов (960x640 px).
// Снизу вверх: врата (спавн + алтарь) → поле надгробий (гончие) →
// ограда с проходом (аколит) → второй алтарь → склеп с боссом.

export const MAP_W = 60;
export const MAP_H = 40;

export function buildGraveyard(): number[][] {
  const m: number[][] = [];
  for (let y = 0; y < MAP_H; y++) {
    const row: number[] = [];
    for (let x = 0; x < MAP_W; x++) {
      row.push((x * 7 + y * 13) % 5 === 0 ? TILES.grassB : TILES.grassA);
    }
    m.push(row);
  }

  const set = (x: number, y: number, t: number) => {
    m[y][x] = t;
  };
  const hline = (x1: number, x2: number, y: number, t: number) => {
    for (let x = x1; x <= x2; x++) set(x, y, t);
  };
  const vline = (x: number, y1: number, y2: number, t: number) => {
    for (let y = y1; y <= y2; y++) set(x, y, t);
  };
  const rect = (x1: number, y1: number, x2: number, y2: number, t: number) => {
    for (let y = y1; y <= y2; y++) hline(x1, x2, y, t);
  };

  // ── внешняя стена ──
  hline(0, MAP_W - 1, 0, TILES.wallTop);
  hline(0, MAP_W - 1, MAP_H - 1, TILES.wall);
  vline(0, 0, MAP_H - 1, TILES.wall);
  vline(MAP_W - 1, 0, MAP_H - 1, TILES.wall);

  // ── склеп (арена босса), x20-40, y2-10, дверь x29-31 ──
  rect(21, 3, 39, 9, TILES.dirt); // пол склепа
  hline(20, 40, 2, TILES.wallTop);
  vline(20, 2, 10, TILES.wall);
  vline(40, 2, 10, TILES.wall);
  hline(20, 28, 10, TILES.wall);
  hline(32, 40, 10, TILES.wall);
  // свечи у входа
  set(28, 11, TILES.candle);
  set(32, 11, TILES.candle);

  // ── тропа от врат к склепу ──
  vline(30, 11, 36, TILES.dirt);
  hline(29, 31, 35, TILES.dirt);

  // ── второй алтарь перед склепом ──
  set(27, 13, TILES.shrineBase);

  // ── линия ограды с проходом (чокпоинт), y20 ──
  hline(3, 27, 20, TILES.fence);
  hline(33, 56, 20, TILES.fence);
  // проход x28-32 — земля
  hline(28, 32, 20, TILES.dirt);

  // ── поле надгробий (низ) ──
  const stones: Array<[number, number]> = [
    [8, 24], [13, 27], [18, 23], [23, 29], [11, 32], [20, 33],
    [37, 25], [42, 29], [47, 23], [52, 27], [44, 33], [35, 31],
    [16, 30], [50, 32], [7, 29], [55, 24],
  ];
  for (const [x, y] of stones) set(x, y, TILES.gravestone);

  // ── верхнее поле (между оградой и склепом) ──
  const upperStones: Array<[number, number]> = [
    [10, 15], [16, 13], [46, 14], [52, 16], [12, 18], [48, 18],
  ];
  for (const [x, y] of upperStones) set(x, y, TILES.gravestone);

  // ── деревья ──
  const trees: Array<[number, number]> = [
    [4, 22], [56, 30], [6, 35], [53, 35], [14, 12], [45, 12], [4, 14], [56, 13],
  ];
  for (const [x, y] of trees) set(x, y, TILES.tree);

  // ── провалы у краёв ──
  rect(2, 25, 3, 28, TILES.void);
  rect(57, 25, 58, 27, TILES.void);

  // ── декор ──
  const skulls: Array<[number, number]> = [[19, 26], [40, 31], [26, 16], [36, 22]];
  for (const [x, y] of skulls) set(x, y, TILES.skull);
  const candles: Array<[number, number]> = [[9, 26], [49, 28], [15, 16], [44, 16], [25, 34]];
  for (const [x, y] of candles) set(x, y, TILES.candle);

  // ── врата (низ): алтарь у спавна ──
  set(27, 35, TILES.shrineBase);

  return m;
}

// Спавны в ТАЙЛАХ (умножить на 16 и центрировать)
export const SPAWNS: SpawnPoint[] = [
  { type: 'player', x: 30, y: 36 },
  { type: 'shrine', x: 27, y: 35 },
  { type: 'shrine', x: 27, y: 13 },
  { type: 'gravehound', x: 14, y: 26 },
  { type: 'gravehound', x: 22, y: 28 },
  { type: 'gravehound', x: 40, y: 27 },
  { type: 'gravehound', x: 48, y: 25 },
  { type: 'gravehound', x: 33, y: 32 },
  { type: 'acolyte', x: 33, y: 17 },
  { type: 'acolyte', x: 20, y: 16 },
  { type: 'boss', x: 30, y: 5 },
];
