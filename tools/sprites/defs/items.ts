import { Matrix, blank, setPixels } from '../lib';

// Иконки предметов 16x16, прозрачный фон, прямые символы палитры.
// Порядок = ITEM frame в src/config/items.ts. Только аппенд в конец!

const e = blank(16, 16);
type P = Array<[number, number, string]>;
const icon = (pts: P): Matrix => setPixels(e, pts);

// линия-хелпер для компактности
function line(x1: number, y1: number, x2: number, y2: number, ch: string): P {
  const pts: P = [];
  const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= n; i++) {
    pts.push([Math.round(x1 + ((x2 - x1) * i) / n || 0), Math.round(y1 + ((y2 - y1) * i) / n || 0), ch]);
  }
  return pts;
}

// ── материалы ─────────────────────────────────────────────────────────────
const boneHound = icon([
  ...line(4, 11, 11, 4, 'b'), [3, 10, 'B'], [4, 12, 'B'], [3, 12, 'B'],
  [11, 3, 'B'], [12, 4, 'B'], [12, 3, 'B'],
]);
const hideRotten = icon([
  ...line(4, 5, 11, 5, '3'), ...line(3, 6, 12, 6, 'b'), ...line(3, 7, 12, 7, 'b'),
  ...line(4, 8, 11, 8, 'b'), ...line(5, 9, 10, 9, '3'), [6, 10, 'g'], [9, 7, 'g'],
]);
const wax = icon([
  [7, 4, 'o'], [7, 5, 'y'], ...line(6, 7, 9, 7, 'B'), ...line(6, 8, 9, 8, 'B'),
  ...line(6, 9, 9, 9, 'B'), ...line(5, 10, 10, 10, 'B'), [5, 11, 'b'], [10, 11, 'b'],
]);
const robeScrap = icon([
  ...line(5, 4, 10, 5, '2'), ...line(4, 6, 11, 7, '2'), ...line(5, 8, 10, 9, '2'),
  ...line(6, 10, 9, 11, '1'), [11, 5, '1'], [4, 9, '1'],
]);
const ratTail = icon([
  ...line(4, 11, 8, 7, 'p'), ...line(8, 7, 11, 6, 'p'), [12, 5, 'p'], [12, 4, 'p'], [3, 12, 'p'],
]);
const wolfFang = icon([
  [7, 4, 'B'], [8, 4, 'B'], [7, 5, 'B'], [8, 5, 'B'], [7, 6, 'B'], [8, 6, 'B'],
  [7, 7, 'B'], [8, 7, 'b'], [8, 8, 'b'], [8, 9, 'b'], [9, 10, 'b'],
]);
const wolfHide = icon([
  ...line(4, 5, 11, 5, 'b'), ...line(3, 6, 12, 6, 'b'), ...line(3, 7, 12, 7, '3'),
  ...line(4, 8, 11, 8, 'b'), ...line(5, 9, 10, 9, '3'), [3, 5, '3'], [12, 5, '3'],
]);
const spiritEssence = icon([
  [7, 5, 'c'], [8, 5, 'c'], [6, 6, 'c'], [7, 6, 'w'], [8, 6, 'w'], [9, 6, 'c'],
  [6, 7, 'c'], [7, 7, 'w'], [8, 7, 'w'], [9, 7, 'c'], [7, 8, 'c'], [8, 8, 'c'],
  [7, 10, 'c'], [8, 11, 'c'],
]);
const boneShard = icon([
  ...line(6, 11, 9, 5, 'B'), [9, 4, 'w'], [5, 12, 'b'], [10, 6, 'b'],
]);
const rustyMetal = icon([
  ...line(5, 5, 10, 5, '3'), ...line(4, 6, 11, 6, '3'), ...line(4, 7, 11, 7, 'o'),
  ...line(4, 8, 11, 8, '3'), ...line(5, 9, 10, 9, 'o'), [6, 6, 'o'], [9, 8, '1'],
]);
const plagueVial = icon([
  [7, 3, 'b'], [8, 3, 'b'], [7, 4, 'B'], [8, 4, 'B'],
  ...line(6, 6, 9, 6, 'B'), ...line(6, 7, 9, 7, 'g'), ...line(6, 8, 9, 8, 'g'),
  ...line(6, 9, 9, 9, 'g'), ...line(7, 10, 8, 10, 'B'), [7, 7, 'w'],
]);
const wardenHeart = icon([
  [6, 5, 'r'], [7, 5, 'r'], [9, 5, 'r'], [10, 5, 'r'],
  ...line(5, 6, 11, 6, 'r'), ...line(5, 7, 11, 7, 'r'), ...line(6, 8, 10, 8, 'r'),
  ...line(7, 9, 9, 9, 'r'), [8, 10, 'r'], [7, 6, 'p'],
]);
const cardinalRelic = icon([
  ...line(7, 3, 7, 11, 'y'), ...line(8, 3, 8, 11, 'y'), ...line(5, 5, 10, 5, 'y'),
  ...line(5, 6, 10, 6, 'y'), [7, 4, 'w'],
]);

// ── оружие ────────────────────────────────────────────────────────────────
const swordPlain = icon([...line(8, 3, 8, 9, 'b'), ...line(6, 10, 10, 10, '3'), [8, 11, '3'], [8, 12, '3']]);
const swordSet = icon([
  ...line(8, 2, 8, 9, 'B'), [8, 3, 'w'], ...line(6, 10, 10, 10, 'y'), [8, 11, 'y'], [8, 12, 'y'],
]);
const staffPlain = icon([...line(8, 3, 8, 12, 'b'), [8, 2, '3']]);
const staffSet = icon([...line(8, 4, 8, 12, 'b'), [8, 3, 'c'], [7, 2, 'c'], [9, 2, 'c'], [8, 1, 'w']]);
const knifePlain = icon([...line(8, 5, 8, 9, 'b'), ...line(7, 10, 9, 10, '3'), [8, 11, '3']]);
const knifeSet = icon([...line(8, 4, 8, 9, 'B'), [8, 5, 'w'], ...line(7, 10, 9, 10, 'o'), [8, 11, 'o']]);
const clawsPlain = icon([...line(5, 5, 7, 10, 'b'), ...line(8, 5, 10, 10, 'b')]);
const clawsSet = icon([...line(5, 4, 7, 10, 'B'), ...line(9, 4, 11, 10, 'B'), [6, 11, 'r'], [10, 11, 'r']]);

// ── броня ─────────────────────────────────────────────────────────────────
const armorPlate = icon([
  ...line(5, 5, 10, 5, '3'), ...line(4, 6, 11, 6, '3'), ...line(4, 7, 11, 7, 'f'),
  ...line(4, 8, 11, 8, '3'), ...line(5, 9, 10, 9, '3'), ...line(6, 10, 9, 10, '2'), [7, 6, 'f'],
]);
const armorRobe = icon([
  ...line(6, 4, 9, 4, 'v'), ...line(5, 5, 10, 5, 'v'), ...line(5, 6, 10, 6, 'v'),
  ...line(4, 7, 11, 7, 'v'), ...line(4, 8, 11, 8, '1'), ...line(4, 9, 11, 9, 'v'),
  ...line(4, 10, 11, 10, '1'), [7, 5, 'c'],
]);
const armorLeather = icon([
  ...line(5, 5, 10, 5, 'b'), ...line(4, 6, 11, 6, 'b'), ...line(4, 7, 11, 7, 'o'),
  ...line(4, 8, 11, 8, 'b'), ...line(5, 9, 10, 9, '3'), ...line(6, 10, 9, 10, 'b'),
]);
const armorCloak = icon([
  ...line(6, 4, 9, 4, '1'), ...line(5, 5, 10, 5, '1'), ...line(4, 6, 11, 6, '1'),
  ...line(4, 7, 11, 7, '0'), ...line(4, 8, 11, 8, '1'), ...line(4, 9, 11, 9, '0'),
  [7, 5, 'r'], [8, 5, 'r'],
]);

// ── обереги ───────────────────────────────────────────────────────────────
const charmSeal = icon([
  ...line(6, 5, 9, 5, 'y'), [5, 6, 'y'], [10, 6, 'y'], [5, 7, 'y'], [10, 7, 'y'],
  ...line(6, 8, 9, 8, 'y'), [7, 6, 'w'], [8, 7, 'y'], [7, 10, 'b'], [8, 11, 'b'],
]);
const charmEye = icon([
  ...line(5, 6, 10, 6, 'c'), [4, 7, 'c'], [11, 7, 'c'], [7, 7, 'w'], [8, 7, '0'],
  ...line(5, 8, 10, 8, 'c'), [7, 10, 'b'], [8, 11, 'b'],
]);
const charmTotem = icon([
  ...line(7, 3, 7, 11, 'o'), ...line(8, 3, 8, 11, '3'), [6, 4, 'o'], [9, 4, 'o'],
  [6, 7, 'y'], [9, 7, 'y'], [6, 10, 'o'], [9, 10, 'o'],
]);
const charmFang = icon([
  [7, 4, '0'], [8, 4, '0'], [7, 5, '0'], [8, 5, '1'], [7, 6, '1'], [8, 6, '1'],
  [8, 7, 'r'], [8, 8, 'r'], [9, 9, 'r'], [7, 2, 'b'], [8, 2, 'b'],
]);
const charmTails = icon([
  ...line(4, 4, 6, 10, 'p'), ...line(8, 4, 8, 10, 'p'), ...line(12, 4, 10, 10, 'p'),
  ...line(5, 3, 11, 3, 'b'),
]);
const charmEmber = icon([
  [7, 6, 'o'], [8, 6, 'o'], [6, 7, 'o'], [7, 7, 'y'], [8, 7, 'y'], [9, 7, 'o'],
  [6, 8, 'r'], [7, 8, 'o'], [8, 8, 'o'], [9, 8, 'r'], [7, 9, 'r'], [8, 9, 'r'],
]);

// ── ключи ─────────────────────────────────────────────────────────────────
const keyBone = icon([
  [5, 5, 'b'], [6, 4, 'b'], [7, 5, 'b'], [6, 6, 'b'], ...line(6, 7, 6, 11, 'b'),
  [7, 9, 'b'], [7, 11, 'b'],
]);
const keyGold = icon([
  [5, 5, 'y'], [6, 4, 'y'], [7, 5, 'y'], [6, 6, 'y'], ...line(6, 7, 6, 11, 'y'),
  [7, 9, 'y'], [7, 11, 'y'], [6, 5, 'w'],
]);

export const itemFrames: Matrix[] = [
  boneHound, //     0
  hideRotten, //    1
  wax, //           2
  robeScrap, //     3
  ratTail, //       4
  wolfFang, //      5
  wolfHide, //      6
  spiritEssence, // 7
  boneShard, //     8
  rustyMetal, //    9
  plagueVial, //    10
  wardenHeart, //   11
  cardinalRelic, // 12
  swordPlain, //    13
  swordSet, //      14
  staffPlain, //    15
  staffSet, //      16
  knifePlain, //    17
  knifeSet, //      18
  clawsPlain, //    19
  clawsSet, //      20
  armorPlate, //    21
  armorRobe, //     22
  armorLeather, //  23
  armorCloak, //    24
  charmSeal, //     25
  charmEye, //      26
  charmTotem, //    27
  charmFang, //     28
  charmTails, //    29
  charmEmber, //    30
  keyBone, //       31
  keyGold, //       32
];
