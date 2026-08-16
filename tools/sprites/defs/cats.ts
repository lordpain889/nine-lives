import { Matrix, editRows, shift, blank, setPixels } from '../lib';

// Базовый кот v2, вид сбоку, смотрит ВПРАВО (влево — setFlipX в рантайме).
// Плейсхолдеры: A = основной мех, C = тёмный мех/контур, D = акцент (ошейник),
// w = глаз. recolor()-карта класса заменяет A/C/D на цвета палитры.
// Раскладка кадров (индексы = CAT_FRAMES в src/config/gameData.ts):
// idle 0-1, walkSide 2-7, walkDown 8-11, walkUp 12-15,
// attack 16-19, roll 20-23, death 24-25.

// ── idle ──────────────────────────────────────────────────────────────────
const idle1: Matrix = [
  '................',
  '................',
  '..........C..C..',
  '..........CCCC..',
  '.........CAAAAC.',
  '.........CAAwAC.',
  '.........CAAAA..',
  '..........AAA...',
  '.C.......ADDA...',
  '.C....CCCAAAAA..',
  '..C..CAAAAAAAA..',
  '..CCCAAAAAAAAA..',
  '....CAAAAAAAAA..',
  '....AAAA...AAA..',
  '....AC.A...AC...',
  '....CC..C..CC...',
];

// хвост поднят выше
const idle2: Matrix = editRows(idle1, {
  7: '.C........AAA...',
  8: '.........ADDA...',
});

// ── walk side: 6-кадровый цикл лап ───────────────────────────────────────
const walk1: Matrix = editRows(idle1, {
  14: '...AC..A...AC...',
  15: '...CC.......CC..',
});
const walk2: Matrix = idle1;
const walk3: Matrix = editRows(idle1, {
  14: '.....AC.A..AC...',
  15: '.....CC....CC...',
});
const walk4: Matrix = editRows(idle1, {
  14: '.....A.CA...CA..',
  15: '......CC....CC..',
});
const walk5: Matrix = idle2;
const walk6: Matrix = editRows(idle2, {
  14: '.....AC.A..AC...',
  15: '.....CC....CC...',
});

// ── walk down (вид спереди, 4 кадра) ─────────────────────────────────────
const down1: Matrix = [
  '................',
  '................',
  '....C....C......',
  '....CC..CC......',
  '....CAAAAC......',
  '...CAAAAAAC.....',
  '...CAwAAwAC.....',
  '...CAAAAAAC.....',
  '....ADDDDA......',
  '....AAAAAA......',
  '....AAAAAA......',
  '....AAAAAA......',
  '....AAAAAA......',
  '....AA..AA......',
  '....AA..AA......',
  '....CC..CC......',
];
const down2: Matrix = editRows(down1, {
  13: '....AA..AA......',
  14: '...AA....AA.....',
  15: '...CC....CC.....',
});
const down3: Matrix = down1;
const down4: Matrix = editRows(down1, {
  13: '....AA..AA......',
  14: '.....AA....AA...',
  15: '.....CC....CC...',
});

// ── walk up (вид сзади, 4 кадра, хвост виден) ────────────────────────────
const up1: Matrix = [
  '................',
  '................',
  '....C....C......',
  '....CC..CC......',
  '....CAAAAC......',
  '...CAAAAAAC.....',
  '...CAAAAAAC.....',
  '...CAAAAAAC.....',
  '....AAAAAA..C...',
  '....AAAAAA.C....',
  '....AAAAAAC.....',
  '....AAAAAA......',
  '....AAAAAA......',
  '....AA..AA......',
  '....AA..AA......',
  '....CC..CC......',
];
const up2: Matrix = editRows(up1, {
  13: '....AA..AA......',
  14: '...AA....AA.....',
  15: '...CC....CC.....',
});
const up3: Matrix = editRows(up1, {
  8: '....AAAAAA......',
  9: '....AAAAAA..C...',
  10: '....AAAAAA.C....',
});
const up4: Matrix = editRows(up3, {
  13: '....AA..AA......',
  14: '.....AA....AA...',
  15: '.....CC....CC...',
});

// ── attack (4 кадра; оружие — оверлеи ниже) ──────────────────────────────
const atk1: Matrix = shift(idle1, -1, 0); // замах, корпус назад
const atk2: Matrix = shift(idle1, 1, 0); //  выпад
const atk3: Matrix = shift(idle1, 1, 0); //  добив/протяг
const atk4: Matrix = idle1; //              возврат

// ── roll (клубок, 4 кадра) ───────────────────────────────────────────────
const ballBase: Matrix = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '.....CCCCC......',
  '....CAAAAAC.....',
  '....CAAAAAC.....',
  '....CAAAAAC.....',
  '....CAAAAAC.....',
  '....CAAAAAC.....',
  '.....CCCCC......',
  '................',
  '................',
  '................',
  '................',
];
const roll1: Matrix = setPixels(ballBase, [[6, 6, 'C'], [7, 6, 'C'], [8, 6, 'C']]);
const roll2: Matrix = setPixels(ballBase, [[9, 7, 'C'], [9, 8, 'C'], [9, 9, 'C']]);
const roll3: Matrix = setPixels(ballBase, [[6, 10, 'C'], [7, 10, 'C'], [8, 10, 'C']]);
const roll4: Matrix = setPixels(ballBase, [[5, 7, 'C'], [5, 8, 'C'], [5, 9, 'C']]);

// ── death ─────────────────────────────────────────────────────────────────
const death1: Matrix = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..C.......C..C..',
  '..C.......CCCC..',
  '...CCCAAACAAAC..',
  '..CAAAAAAAAwAA..',
  '..CAAAAAAAAAAA..',
  '..CCCCCCCCCCCC..',
];
const death2: Matrix = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..C.......CCCC..',
  '..CCCAAAAACACC..',
  '..CCCCCCCCCCCC..',
  '................',
];

export const catBodyFrames: Matrix[] = [
  idle1, idle2, //                          0-1
  walk1, walk2, walk3, walk4, walk5, walk6, // 2-7
  down1, down2, down3, down4, //            8-11
  up1, up2, up3, up4, //                    12-15
  atk1, atk2, atk3, atk4, //                16-19
  roll1, roll2, roll3, roll4, //            20-23
  death1, death2, //                        24-25
];

export const FRAMES_PER_CLASS = catBodyFrames.length; // 26
export const ATTACK_FRAME_START = 16;
export const ATTACK_FRAME_COUNT = 4;

// ── оверлеи оружия (прямые символы палитры, поверх кадров атаки) ──────────
const e = blank(16, 16);

// Рыцарь: меч — замах вверх → горизонтальный росчерк → протяг
const knightAtk1 = setPixels(e, [
  [8, 0, 'w'], [8, 1, 'B'], [8, 2, 'B'], [8, 3, 'B'], [8, 4, 'y'],
]);
const knightAtk2 = setPixels(e, [
  [13, 8, 'B'], [14, 8, 'B'], [15, 8, 'w'],
  [14, 6, 'B'], [14, 10, 'B'], [13, 5, 'B'], [13, 11, 'B'],
]);
const knightAtk3 = setPixels(e, [
  [13, 9, 'B'], [14, 9, 'B'], [15, 10, 'B'],
]);

// Маг: посох с циановым огоньком, на выпаде — вспышка
const mageStaff = setPixels(e, [
  [14, 4, 'b'], [14, 5, 'b'], [14, 6, 'b'], [14, 7, 'b'],
  [14, 8, 'b'], [14, 9, 'b'], [14, 3, 'c'],
]);
const mageAtk2 = setPixels(mageStaff, [
  [14, 2, 'c'], [15, 3, 'c'], [13, 3, 'w'], [15, 1, 'c'],
]);
const mageAtk3 = setPixels(mageStaff, [[14, 2, 'c']]);

// Наёмник: короткий клинок — замах → укол → протяг
const mercAtk1 = setPixels(e, [[9, 2, 'B'], [10, 3, 'B'], [10, 4, 'y']]);
const mercAtk2 = setPixels(e, [
  [13, 8, 'B'], [14, 8, 'B'], [15, 7, 'w'], [15, 8, 'B'],
]);
const mercAtk3 = setPixels(e, [[14, 9, 'B'], [15, 9, 'B']]);

// Асасин: два когтя-росчерка
const assAtk2 = setPixels(e, [
  [13, 6, 'w'], [14, 7, 'w'], [15, 8, 'w'],
  [13, 9, 'w'], [14, 8, 'w'],
]);
const assAtk3 = setPixels(e, [
  [14, 6, 'w'], [15, 7, 'w'], [14, 9, 'w'], [15, 8, 'w'],
]);

// Оверлеи по классам: [atk1, atk2, atk3, atk4]
export const weaponOverlays: Record<string, [Matrix, Matrix, Matrix, Matrix]> = {
  knight: [knightAtk1, knightAtk2, knightAtk3, e],
  mage: [mageStaff, mageAtk2, mageAtk3, mageStaff],
  mercenary: [mercAtk1, mercAtk2, mercAtk3, e],
  assassin: [e, assAtk2, assAtk3, e],
};

// Перекраска плейсхолдеров по классам (порядок = ряды в спрайтшите!)
export const classRecolors: Array<{ key: string; map: Record<string, string> }> = [
  { key: 'knight', map: { A: '3', C: '2', D: 'b' } }, //    каменно-серый
  { key: 'mage', map: { A: 'v', C: '1', D: 'c' } }, //      фиолетовый
  { key: 'mercenary', map: { A: 'b', C: '3', D: 'o' } }, // пыльно-рыжий
  { key: 'assassin', map: { A: '1', C: '0', D: 'r' } }, //  почти чёрный
];
