import { TILES } from '../config/gameData';

// Временная тестовая карта для M1 (заменится на graveyard.ts).
// Детерминированная: без Math.random.

const W = 40;
const H = 30;

export function buildTestMap(): number[][] {
  const map: number[][] = [];
  for (let y = 0; y < H; y++) {
    const row: number[] = [];
    for (let x = 0; x < W; x++) {
      // трава с вариацией по детерминированному хэшу
      row.push((x * 7 + y * 13) % 5 === 0 ? TILES.grassB : TILES.grassA);
    }
    map.push(row);
  }

  // рамка из стен
  for (let x = 0; x < W; x++) {
    map[0][x] = TILES.wallTop;
    map[H - 1][x] = TILES.wall;
  }
  for (let y = 0; y < H; y++) {
    map[y][0] = TILES.wall;
    map[y][W - 1] = TILES.wall;
  }

  // тропа
  for (let y = 2; y < H - 2; y++) map[y][20] = TILES.dirt;
  for (let x = 5; x < 36; x++) map[15][x] = TILES.dirt;

  // надгробия, деревья, декор
  const stones: Array<[number, number]> = [
    [6, 5], [9, 7], [13, 4], [26, 6], [30, 9], [34, 5],
    [7, 20], [11, 24], [27, 22], [33, 25], [16, 9], [24, 18],
  ];
  for (const [x, y] of stones) map[y][x] = TILES.gravestone;

  const trees: Array<[number, number]> = [[4, 12], [36, 14], [15, 26], [29, 3]];
  for (const [x, y] of trees) map[y][x] = TILES.tree;

  const skulls: Array<[number, number]> = [[10, 12], [28, 16], [18, 22]];
  for (const [x, y] of skulls) map[y][x] = TILES.skull;

  const candles: Array<[number, number]> = [[14, 10], [25, 8], [12, 18]];
  for (const [x, y] of candles) map[y][x] = TILES.candle;

  // кусок ограды
  for (let x = 8; x <= 14; x++) map[8][x] = TILES.fence;

  return map;
}
