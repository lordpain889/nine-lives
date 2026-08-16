import { Matrix, blank, fill, setPixels } from '../lib';

// Тайлы 16x16, прямые символы палитры (без плейсхолдеров).
// Порядок в массиве tileFrames = индексы тайлов в карте.
// Должен совпадать с TILES в src/config/gameData.ts.

const T = 16;
type Px = Array<[number, number, string]>;

function speckled(base: string, specks: Px): Matrix {
  return setPixels(fill(T, T, base), specks);
}

// ── земля ─────────────────────────────────────────────────────────────────
const grassA = speckled('1', [
  [2, 3, 'g'], [2, 4, 'g'], [9, 7, 'g'], [9, 8, 'g'], [12, 13, 'g'], [12, 14, 'g'],
  [13, 2, '0'], [5, 11, '0'], [4, 8, '2'], [10, 3, '2'],
]);

const grassB = speckled('1', [
  [6, 2, 'g'], [6, 3, 'g'], [13, 9, 'g'], [13, 10, 'g'], [3, 13, 'g'], [3, 14, 'g'],
  [8, 12, '0'], [14, 5, '2'], [2, 7, '2'], [10, 10, '0'],
]);

const dirt = speckled('2', [
  [3, 3, '1'], [7, 9, '1'], [12, 4, '1'], [10, 13, '1'], [2, 8, '1'],
  [5, 12, '3'], [13, 11, '3'], [8, 2, '3'],
]);

// ── надгробие (коллизия) ──────────────────────────────────────────────────
const gravestonePx: Px = [];
for (let x = 5; x <= 10; x++) gravestonePx.push([x, 3, '3']); // скруглённый верх
for (let y = 4; y <= 12; y++) {
  for (let x = 4; x <= 11; x++) gravestonePx.push([x, y, '3']);
}
for (let x = 5; x <= 7; x++) gravestonePx.push([x, 3, 'f']); // блик сверху
for (let y = 4; y <= 8; y++) gravestonePx.push([4, y, 'f']); // блик слева
for (let y = 4; y <= 12; y++) gravestonePx.push([11, y, '2']); // тень справа
for (let x = 4; x <= 11; x++) gravestonePx.push([x, 12, '2']); // тень снизу
for (let y = 5; y <= 9; y++) gravestonePx.push([7, y, '2']); // крест
for (let x = 6; x <= 9; x++) gravestonePx.push([x, 6, '2']);
for (let x = 4; x <= 12; x++) gravestonePx.push([x, 13, '0']); // тень на траве
const gravestone = setPixels(grassA, gravestonePx);

// ── стена склепа (коллизия): кирпичи ─────────────────────────────────────
const wallPx: Px = [];
for (const y of [3, 7, 11, 15]) {
  for (let x = 0; x < T; x++) wallPx.push([x, y, '0']); // горизонтальные швы
}
const joints = [ [5, 13], [1, 9], [5, 13], [1, 9] ]; // стыки в шахматном порядке
joints.forEach((cols, band) => {
  for (const x of cols) {
    for (let y = band * 4; y < band * 4 + 3; y++) wallPx.push([x, y, '0']);
  }
});
wallPx.push([2, 1, '3'], [10, 5, '3'], [7, 9, '3'], [14, 13, '3']); // блики
const wall = setPixels(fill(T, T, '2'), wallPx);

// верх стены (крыша, коллизия)
const wallTop = speckled('1', [
  [0, 15, '0'], [1, 15, '0'], [2, 15, '0'], [3, 15, '0'], [4, 15, '0'], [5, 15, '0'],
  [6, 15, '0'], [7, 15, '0'], [8, 15, '0'], [9, 15, '0'], [10, 15, '0'], [11, 15, '0'],
  [12, 15, '0'], [13, 15, '0'], [14, 15, '0'], [15, 15, '0'],
  [3, 4, '2'], [11, 7, '2'], [6, 11, '2'],
]);

// ── кованая ограда (коллизия) ─────────────────────────────────────────────
const fencePx: Px = [];
for (const y of [4, 10]) {
  for (let x = 0; x < T; x++) fencePx.push([x, y, '2']); // перекладины
}
for (const x of [3, 8, 13]) {
  fencePx.push([x, 1, 'f']); // остриё
  for (let y = 2; y <= 13; y++) fencePx.push([x, y, '3']); // прутья
}
const fence = setPixels(grassA, fencePx);

// ── провал/пустота (коллизия) ─────────────────────────────────────────────
const voidTile = speckled('0', [
  [3, 4, '1'], [4, 4, '1'], [9, 8, '1'], [10, 8, '1'],
  [6, 12, '1'], [7, 12, '1'], [12, 2, '1'], [13, 2, '1'],
]);

// ── декор (проходимый) ────────────────────────────────────────────────────
const skullPx: Px = [];
for (let x = 6; x <= 9; x++) skullPx.push([x, 6, 'b']);
for (let x = 5; x <= 10; x++) skullPx.push([x, 7, 'b'], [x, 8, 'b']);
for (let x = 6; x <= 9; x++) skullPx.push([x, 9, 'b']);
skullPx.push([6, 8, '0'], [9, 8, '0']); // глазницы
skullPx.push([6, 10, 'B'], [8, 10, 'B']); // зубы
const skull = setPixels(grassA, skullPx);

const candle = setPixels(grassA, [
  [7, 9, 'B'], [8, 9, 'B'], [7, 10, 'B'], [8, 10, 'B'], // огарок
  [7, 11, '0'], [8, 11, '0'], // тень
  [7, 8, 'y'], [7, 7, 'o'], // пламя
]);

// ── основание алтаря ──────────────────────────────────────────────────────
const shrinePx: Px = [];
for (let y = 3; y <= 12; y++) {
  for (let x = 3; x <= 12; x++) shrinePx.push([x, y, '2']);
}
for (let x = 3; x <= 12; x++) shrinePx.push([x, 3, '3'], [x, 12, '3']);
for (let y = 3; y <= 12; y++) shrinePx.push([3, y, '3'], [12, y, '3']);
shrinePx.push([5, 5, 'c'], [10, 5, 'c'], [5, 10, 'c'], [10, 10, 'c'], [7, 7, 'c'], [8, 8, 'c']); // руны
const shrineBase = setPixels(grassA, shrinePx);

// ── мёртвое дерево (коллизия) ─────────────────────────────────────────────
const treePx: Px = [];
for (let y = 2; y <= 13; y++) {
  for (let x = 6; x <= 9; x++) treePx.push([x, y, '1']);
}
for (let y = 2; y <= 13; y++) treePx.push([6, y, '0']); // тёмный край
treePx.push([4, 4, '1'], [5, 5, '1'], [11, 3, '1'], [10, 4, '1']); // ветви
for (let x = 4; x <= 11; x++) treePx.push([x, 14, '0']); // корни/тень
const tree = setPixels(grassA, treePx);

// ── декор-слой (прозрачный фон, кладётся ПОВЕРХ земли) ────────────────────
const d = blank(T, T);

const tuftA = setPixels(d, [
  [4, 9, 'g'], [4, 10, 'g'], [5, 10, 'g'], [3, 10, '2'],
  [11, 5, 'g'], [11, 6, 'g'], [12, 6, '2'],
]);
const tuftB = setPixels(d, [
  [7, 12, 'g'], [7, 13, 'g'], [8, 13, 'g'], [6, 13, '2'],
  [13, 3, 'g'], [13, 4, '2'], [2, 6, 'g'], [2, 7, '2'],
]);
const crack = setPixels(d, [
  [3, 8, '0'], [4, 9, '0'], [5, 9, '0'], [6, 10, '0'], [7, 10, '0'],
  [8, 11, '0'], [9, 11, '0'], [10, 12, '0'], [6, 11, '0'],
]);
const pebbles = setPixels(d, [
  [4, 4, '3'], [5, 4, '2'], [10, 8, '3'], [11, 8, '2'], [11, 9, '2'],
  [6, 12, '2'], [13, 3, '3'],
]);
const bonesSmall = setPixels(d, [
  [4, 10, 'b'], [5, 10, 'b'], [6, 10, 'b'], [3, 9, 'b'], [7, 11, 'b'],
  [11, 5, 'b'], [12, 5, 'b'], [12, 4, 'b'],
]);
const shroomsSmall = setPixels(d, [
  [5, 9, 'g'], [4, 9, 'g'], [4, 8, 'g'], [5, 8, 'g'], [4, 10, 'b'], [5, 10, 'b'],
  [11, 12, 'g'], [11, 11, 'g'], [11, 13, 'b'],
]);

// Индексы тайлов (см. TILES/DECOR в src/config/gameData.ts)
export const tileFrames: Matrix[] = [
  grassA, //     0
  grassB, //     1
  dirt, //       2
  gravestone, // 3  коллизия
  wall, //       4  коллизия
  wallTop, //    5  коллизия
  fence, //      6  коллизия
  voidTile, //   7  коллизия
  skull, //      8
  candle, //     9
  shrineBase, // 10
  tree, //       11 коллизия
  tuftA, //      12 декор
  tuftB, //      13 декор
  crack, //      14 декор
  pebbles, //    15 декор
  bonesSmall, // 16 декор
  shroomsSmall, // 17 декор
  ...townTiles(), // 18-25: город (см. ниже)
];

// ── тайлы чумного города (индексы 18+) ────────────────────────────────────
function townTiles(): Matrix[] {
  // брусчатка: камни 4x4 со швами
  const cobble = (seedShift: number): Matrix => {
    const px: Px = [];
    for (const y of [3, 7, 11, 15]) for (let x = 0; x < T; x++) px.push([x, y, '1']);
    const joints = [[3, 11], [7, 15], [3, 11], [7, 15]];
    joints.forEach((cols, band) => {
      for (const x of cols) {
        for (let y = band * 4; y < band * 4 + 3; y++) px.push([(x + seedShift) % T, y, '1']);
      }
    });
    px.push([2 + seedShift, 2, '3'], [9, 6, '3'], [5, 10, '3'], [12, 13, '3']);
    return setPixels(fill(T, T, '2'), px);
  };

  // стена дома: тёмные доски
  const houseWallPx: Px = [];
  for (const x of [3, 8, 12]) for (let y = 0; y < T; y++) houseWallPx.push([x, y, '0']);
  houseWallPx.push([5, 3, '2'], [10, 9, '2'], [14, 5, '2'], [1, 12, '2']);
  const houseWall = setPixels(fill(T, T, '1'), houseWallPx);

  // крыша: черепица глубокого синего
  const roofPx: Px = [];
  for (const y of [3, 7, 11, 15]) for (let x = 0; x < T; x++) roofPx.push([x, y, '0']);
  for (const y of [1, 5, 9, 13]) roofPx.push([4, y, '1'], [11, y, '1']);
  const roof = setPixels(fill(T, T, 'u'), roofPx);

  // дверь в стене (закрыта, интерьеров нет)
  const doorPx: Px = [];
  for (let y = 4; y < T; y++) for (let x = 5; x <= 10; x++) doorPx.push([x, y, '1']);
  for (let y = 4; y < T; y++) doorPx.push([5, y, 'b'], [10, y, 'b']);
  for (let x = 5; x <= 10; x++) doorPx.push([x, 4, 'b']);
  doorPx.push([9, 10, 'y']);
  const houseDoor = setPixels(houseWall, doorPx);

  // окно с болезненным светом
  const winPx: Px = [];
  for (let y = 5; y <= 10; y++) for (let x = 5; x <= 10; x++) winPx.push([x, y, '0']);
  for (let y = 6; y <= 9; y++) for (let x = 6; x <= 9; x++) winPx.push([x, y, 'g']);
  winPx.push([7, 7, 'y'], [8, 8, 'y']);
  const houseWindow = setPixels(houseWall, winPx);

  // фонарный столб на брусчатке
  const lanternPx: Px = [];
  for (let y = 4; y <= 13; y++) lanternPx.push([7, y, '0']);
  lanternPx.push([6, 3, '0'], [8, 3, '0'], [7, 2, 'y'], [7, 3, 'o'], [6, 14, '0'], [8, 14, '0']);
  const lantern = setPixels(cobble(0), lanternPx);

  // торговый прилавок
  const stallPx: Px = [];
  for (let x = 2; x <= 13; x++) stallPx.push([x, 4, 'o'], [x, 5, x % 2 ? 'o' : 'b']);
  for (let x = 2; x <= 13; x++) stallPx.push([x, 9, 'b'], [x, 10, 'b']);
  for (const x of [2, 13]) for (let y = 5; y <= 13; y++) stallPx.push([x, y, '1']);
  const stall = setPixels(cobble(1), stallPx);

  return [cobble(0), cobble(1), houseWall, roof, houseDoor, houseWindow, lantern, stall];
}
