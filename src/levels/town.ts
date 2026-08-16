import { TILES, DECOR, TOWN_TILES } from '../config/gameData';
import type { ZoneDef } from '../types';

// Чумной город — хаб. 50x35: площадь с алтарём, дома-коробки (без интерьеров),
// кузница, прилавок торговца. Крысы по переулкам, доктор на северо-востоке.

const W = 50;
const H = 35;

function buildTown(): { ground: number[][]; decor: number[][] } {
  const m: number[][] = [];
  for (let y = 0; y < H; y++) {
    const row: number[] = [];
    for (let x = 0; x < W; x++) {
      row.push((x * 7 + y * 13) % 5 === 0 ? TILES.grassB : TILES.grassA);
    }
    m.push(row);
  }
  const set = (x: number, y: number, t: number) => {
    m[y][x] = t;
  };
  const rect = (x1: number, y1: number, x2: number, y2: number, t: number) => {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) set(x, y, t);
  };
  const hline = (x1: number, x2: number, y: number, t: number) => {
    for (let x = x1; x <= x2; x++) set(x, y, t);
  };
  const vline = (x: number, y1: number, y2: number, t: number) => {
    for (let y = y1; y <= y2; y++) set(x, y, t);
  };

  // внешняя стена
  hline(0, W - 1, 0, TILES.wallTop);
  hline(0, W - 1, H - 1, TILES.wall);
  vline(0, 0, H - 1, TILES.wall);
  vline(W - 1, 0, H - 1, TILES.wall);

  // площадь-брусчатка
  for (let y = 11; y <= 24; y++) {
    for (let x = 14; x <= 36; x++) {
      set(x, y, (x + y) % 2 ? TOWN_TILES.cobbleA : TOWN_TILES.cobbleB);
    }
  }
  // дороги к воротам
  for (let y = 25; y <= 33; y++) hline(24, 26, y, TOWN_TILES.cobbleA);
  for (let y = 1; y <= 10; y++) hline(24, 26, y, TOWN_TILES.cobbleA);
  hline(1, 13, 17, TOWN_TILES.cobbleA);
  hline(1, 13, 18, TOWN_TILES.cobbleA);

  // дома: крыша + южная стена с дверью/окнами
  const house = (x1: number, y1: number, x2: number, y2: number, doorX: number) => {
    rect(x1, y1, x2, y2 - 1, TOWN_TILES.roof);
    hline(x1, x2, y2, TOWN_TILES.houseWall);
    set(doorX, y2, TOWN_TILES.houseDoor);
    if (doorX - 2 >= x1) set(doorX - 2, y2, TOWN_TILES.houseWindow);
    if (doorX + 2 <= x2) set(doorX + 2, y2, TOWN_TILES.houseWindow);
  };
  house(6, 5, 13, 9, 9);
  house(38, 5, 45, 9, 41);
  house(5, 24, 12, 29, 9); //  кузница
  house(39, 24, 46, 29, 42);

  // фонари по углам площади
  set(14, 11, TOWN_TILES.lantern);
  set(36, 11, TOWN_TILES.lantern);
  set(14, 24, TOWN_TILES.lantern);
  set(36, 24, TOWN_TILES.lantern);

  // прилавок торговца
  set(31, 15, TOWN_TILES.stall);
  set(32, 15, TOWN_TILES.stall);

  // алтарь на площади
  set(25, 18, TILES.shrineBase);

  // ворота: юг (кладбище) — проём в стене
  hline(24, 26, H - 1, TOWN_TILES.cobbleA);
  // запад (лес)
  vline(0, 17, 18, TILES.dirt);
  // север (катакомбы)
  hline(24, 26, 0, TOWN_TILES.cobbleA);

  // свечи и декор
  set(20, 14, TILES.candle);
  set(29, 21, TILES.candle);

  // decor: трещины/камешки на брусчатке, трава на земле
  const decor: number[][] = m.map((row) => row.map(() => -1));
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const g = m[y][x];
      const h = (x * 2654435761 + y * 40503) % 100;
      if ((g === TOWN_TILES.cobbleA || g === TOWN_TILES.cobbleB) && h < 5) {
        decor[y][x] = h < 2 ? DECOR.crack : DECOR.pebbles;
      } else if ((g === TILES.grassA || g === TILES.grassB) && h < 4) {
        decor[y][x] = [DECOR.tuftA, DECOR.tuftB, DECOR.bones][h % 3];
      }
    }
  }
  return { ground: m, decor };
}

export const townZone: ZoneDef = {
  key: 'town',
  nameRu: 'Чумной город',
  buildMap: buildTown,
  spawns: [
    { type: 'player', x: 25, y: 31 },
    { type: 'shrine', x: 25, y: 18 },
    { type: 'npc-blacksmith', x: 10, y: 31 },
    { type: 'npc-quartermaster', x: 21, y: 28 },
    { type: 'npc-merchant', x: 31, y: 17 },
    { type: 'rat', x: 8, y: 13 },
    { type: 'rat', x: 9, y: 14 },
    { type: 'rat', x: 42, y: 14 },
    { type: 'rat', x: 43, y: 13 },
    { type: 'rat', x: 12, y: 21 },
    { type: 'rat', x: 38, y: 22 },
    { type: 'doctor', x: 44, y: 12 },
  ],
  exits: [
    { x: 24, y: 34, w: 3, h: 1, toZone: 'graveyard', toX: 45, toY: 2 },
    {
      x: 0, y: 17, w: 1, h: 2,
      toZone: 'forest', toX: 61, toY: 22,
      lockFlag: 'forest_open',
      lockedTextRu: 'тропа заросла. спроси квартирмейстера.',
    },
    {
      x: 24, y: 0, w: 3, h: 1,
      toZone: 'catacombs', toX: 30, toY: 37,
      lockFlag: 'catacombs_open',
      lockedTextRu: 'решётка заперта. нужен костяной ключ.',
    },
  ],
  ambient: {
    bgColor: '#0d0a14',
    tint: { color: 0x3e7a4e, alpha: 0.06 },
    fogDensity: 1,
    particles: ['dust', 'embers'],
  },
};
