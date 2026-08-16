import { TILES, DECOR, FOREST_TILES, CRYPT_TILES } from '../config/gameData';
import type { ZoneDef } from '../types';

// Катакомбы под собором 60x40: тоннели в кирпиче, шипы, скелеты-стражи.
// Вертикальный хребет x29-31 соединяет вход (юг) и врата собора (север).

const W = 60;
const H = 40;

function buildCatacombs(): { ground: number[][]; decor: number[][] } {
  // всё — кирпич; выгрызаем коридоры и залы
  const m: number[][] = [];
  for (let y = 0; y < H; y++) {
    m.push(Array.from({ length: W }, () => CRYPT_TILES.brick as number));
  }
  const carve = (x1: number, y1: number, x2: number, y2: number) => {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        m[y][x] = (x * 7 + y * 13) % 4 === 0 ? CRYPT_TILES.stoneB : CRYPT_TILES.stoneA;
      }
    }
  };

  carve(27, 33, 33, 38); //  вход с юга
  carve(29, 8, 31, 33); //   хребет
  carve(8, 13, 52, 16); //   верхняя галерея
  carve(10, 26, 52, 29); //  нижняя галерея
  carve(8, 8, 18, 16); //    зал NW
  carve(42, 8, 54, 16); //   зал NE
  carve(10, 24, 20, 32); //  зал SW
  carve(40, 24, 52, 32); //  зал SE
  carve(24, 17, 36, 23); //  центральный зал с алтарём

  // проход в собор (север)
  carve(29, 6, 31, 8);
  for (const x of [29, 30, 31]) m[5][x] = CRYPT_TILES.stoneA;

  // вход из города (юг)
  for (const x of [29, 30, 31]) m[H - 1][x] = CRYPT_TILES.stoneA;
  carve(29, 38, 31, 38);

  // алтарь в центральном зале
  m[20][30] = TILES.shrineBase;

  // груды костей
  const piles: Array<[number, number]> = [
    [10, 14], [50, 15], [12, 30], [50, 26], [26, 22], [35, 18], [44, 9], [9, 9],
  ];
  for (const [x, y] of piles) m[y][x] = CRYPT_TILES.bonePile;

  // светящиеся грибы
  const shroomSpots: Array<[number, number]> = [[15, 13], [46, 14], [14, 27], [47, 30], [25, 18], [30, 12]];
  for (const [x, y] of shroomSpots) m[y][x] = FOREST_TILES.bigShroom;

  // свечи
  m[34][28] = TILES.candle;
  m[9][30] = TILES.candle;

  const decor: number[][] = m.map((row) => row.map(() => -1));
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const g = m[y][x];
      if (g !== CRYPT_TILES.stoneA && g !== CRYPT_TILES.stoneB) continue;
      const h = (x * 48271 + y * 16807) % 100;
      if (h < 7) decor[y][x] = [DECOR.crack, DECOR.bones, DECOR.pebbles][h % 3];
    }
  }
  return { ground: m, decor };
}

export const catacombsZone: ZoneDef = {
  key: 'catacombs',
  nameRu: 'Катакомбы',
  buildMap: buildCatacombs,
  spawns: [
    { type: 'player', x: 30, y: 36 },
    { type: 'shrine', x: 30, y: 20 },
    { type: 'skeleton', x: 12, y: 12 },
    { type: 'skeleton', x: 46, y: 12 },
    { type: 'skeleton', x: 14, y: 28 },
    { type: 'skeleton', x: 46, y: 28 },
    { type: 'skeleton', x: 30, y: 14 },
    { type: 'skeleton', x: 33, y: 21 },
    { type: 'spirit', x: 20, y: 14 },
    { type: 'spirit', x: 42, y: 27 },
    // шипы на хребте и галереях
    { type: 'spikes', x: 30, y: 24 },
    { type: 'spikes', x: 30, y: 30 },
    { type: 'spikes', x: 29, y: 10 },
    { type: 'spikes', x: 31, y: 17 },
    { type: 'spikes', x: 20, y: 15 },
    { type: 'spikes', x: 40, y: 14 },
    { type: 'spikes', x: 25, y: 28 },
  ],
  exits: [
    { x: 29, y: 39, w: 3, h: 1, toZone: 'town', toX: 25, toY: 2 },
    {
      x: 29, y: 5, w: 3, h: 1,
      toZone: 'cathedral', toX: 18, toY: 21,
      lockFlag: 'cathedral_open',
      lockedTextRu: 'врата собора заперты. нужен золотой ключ.',
    },
  ],
  ambient: {
    bgColor: '#0d0a14',
    tint: { color: 0x2b4a78, alpha: 0.14 },
    fogDensity: 1,
    particles: ['spores'],
  },
};
