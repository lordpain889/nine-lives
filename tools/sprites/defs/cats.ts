import { Matrix, editRows, shift, blank, setPixels } from '../lib';

// Базовый кот, вид сбоку, смотрит ВПРАВО (влево — setFlipX в рантайме).
// Плейсхолдеры: A = основной мех, C = тёмный мех/контур, D = акцент (шарф),
// w = глаз. recolor()-карта класса заменяет A/C/D на цвета палитры.

// ── idle ──────────────────────────────────────────────────────────────────
const idle1: Matrix = [
  '................',
  '................',
  '................',
  '..........C..C..',
  '..........CCCC..',
  '.........CAAAAC.',
  '.........CAAwAC.',
  '..........AAAA..',
  '..C......ADDDA..',
  '..C..CCCAAAAAA..',
  '...C.CAAAAAAA...',
  '...CCAAAAAAAA...',
  '....CAAAAAAAA...',
  '....AAA...AAA...',
  '....AC.....CA...',
  '....CC.....CC...',
];

// хвост поднят
const idle2: Matrix = editRows(idle1, {
  7: '..C.......AAAA..',
  8: '.........ADDDA..',
});

// ── walk (side) ───────────────────────────────────────────────────────────
const walk1: Matrix = editRows(idle1, {
  14: '...AC.......CA..',
  15: '...CC........CC.',
});
const walk2: Matrix = idle1;
const walk3: Matrix = editRows(idle1, {
  14: '.....CA....AC...',
  15: '......CC..CC....',
});
const walk4: Matrix = idle2;

// ── walk down (вид спереди) ───────────────────────────────────────────────
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

// ── walk up (вид сзади, хвост виден) ──────────────────────────────────────
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
  8: '....AAAAAA......',
  9: '....AAAAAA.C....',
  13: '....AA..AA......',
  14: '...AA....AA.....',
  15: '...CC....CC.....',
});

// ── attack (тело; оружие — оверлеи ниже) ──────────────────────────────────
const atk1: Matrix = shift(idle1, -1, 0); // замах, корпус назад
const atk2: Matrix = shift(idle1, 1, 0); //  выпад, корпус вперёд
const atk3: Matrix = idle1; //              возврат

// ── roll (клубок) ─────────────────────────────────────────────────────────
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
// «вращение» — тёмная дуга (уши/лапы) в 4 позициях по кругу
const roll1: Matrix = setPixels(ballBase, [
  [6, 6, 'C'],
  [7, 6, 'C'],
  [8, 6, 'C'],
]);
const roll2: Matrix = setPixels(ballBase, [
  [9, 7, 'C'],
  [9, 8, 'C'],
  [9, 9, 'C'],
]);
const roll3: Matrix = setPixels(ballBase, [
  [6, 10, 'C'],
  [7, 10, 'C'],
  [8, 10, 'C'],
]);
const roll4: Matrix = setPixels(ballBase, [
  [5, 7, 'C'],
  [5, 8, 'C'],
  [5, 9, 'C'],
]);

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

// Порядок кадров ОДНОГО класса. Индексы должны совпадать с
// CAT_FRAMES в src/config/gameData.ts.
export const catBodyFrames: Matrix[] = [
  idle1, idle2, //             0-1  idle
  walk1, walk2, walk3, walk4, //  2-5  walk side
  down1, down2, //             6-7  walk down
  up1, up2, //                 8-9  walk up
  atk1, atk2, atk3, //         10-12 attack
  roll1, roll2, roll3, roll4, // 13-16 roll
  death1, death2, //           17-18 death
];

export const FRAMES_PER_CLASS = catBodyFrames.length; // 19

// ── оверлеи оружия (прямые символы палитры, поверх кадров атаки) ──────────
const e = blank(16, 16);

// Рыцарь: меч — замах вверх, потом горизонтальный росчерк
const knightAtk1 = setPixels(e, [
  [8, 1, 'B'],
  [8, 2, 'B'],
  [8, 3, 'B'],
  [8, 4, 'y'],
]);
const knightAtk2 = setPixels(e, [
  [13, 8, 'B'],
  [14, 8, 'B'],
  [15, 8, 'w'],
  [14, 6, 'B'],
  [14, 10, 'B'],
]);

// Маг: посох с циановым огоньком, на выпаде — вспышка
const mageStaff = setPixels(e, [
  [14, 4, 'b'],
  [14, 5, 'b'],
  [14, 6, 'b'],
  [14, 7, 'b'],
  [14, 8, 'b'],
  [14, 9, 'b'],
  [14, 3, 'c'],
]);
const mageAtk2 = setPixels(mageStaff, [
  [14, 2, 'c'],
  [15, 3, 'c'],
  [13, 3, 'w'],
]);

// Наёмник: короткий клинок
const mercAtk1 = setPixels(e, [
  [9, 3, 'B'],
  [10, 4, 'B'],
]);
const mercAtk2 = setPixels(e, [
  [13, 8, 'B'],
  [14, 8, 'B'],
  [15, 7, 'w'],
]);

// Асасин: два когтя-росчерка
const assAtk1 = blank(16, 16);
const assAtk2 = setPixels(e, [
  [13, 6, 'w'],
  [14, 7, 'w'],
  [15, 8, 'w'],
  [13, 9, 'w'],
  [14, 8, 'w'],
]);

// Оверлеи по классам: [atk1, atk2, atk3]
export const weaponOverlays: Record<string, [Matrix, Matrix, Matrix]> = {
  knight: [knightAtk1, knightAtk2, e],
  mage: [mageStaff, mageAtk2, mageStaff],
  mercenary: [mercAtk1, mercAtk2, e],
  assassin: [assAtk1, assAtk2, e],
};

// Перекраска плейсхолдеров по классам (порядок = ряды в спрайтшите!)
export const classRecolors: Array<{ key: string; map: Record<string, string> }> = [
  { key: 'knight', map: { A: '3', C: '2', D: 'b' } }, //    каменно-серый
  { key: 'mage', map: { A: 'v', C: '1', D: 'c' } }, //      фиолетовый
  { key: 'mercenary', map: { A: 'b', C: '3', D: 'o' } }, // пыльно-рыжий
  { key: 'assassin', map: { A: '1', C: '0', D: 'r' } }, //  почти чёрный
];
