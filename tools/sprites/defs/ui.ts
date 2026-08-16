import { Matrix, blank, setPixels } from '../lib';

// UI-спрайты 16x16: пламя алтаря (3), рыбья кость (2), фляга (1).
// Индексы = UI_FRAMES в src/config/gameData.ts.

const e = blank(16, 16);

// ── пламя алтаря ──────────────────────────────────────────────────────────
const flame1: Matrix = setPixels(e, [
  [7, 6, 'o'],
  [6, 7, 'o'], [7, 7, 'y'], [8, 7, 'o'],
  [6, 8, 'o'], [7, 8, 'y'], [8, 8, 'y'],
  [6, 9, 'o'], [7, 9, 'y'], [8, 9, 'o'],
  [7, 10, 'o'], [8, 10, 'o'],
  [7, 11, 'r'],
]);
const flame2: Matrix = setPixels(e, [
  [8, 5, 'o'],
  [7, 6, 'o'], [8, 6, 'y'],
  [6, 7, 'o'], [7, 7, 'y'], [8, 7, 'y'], [9, 7, 'o'],
  [6, 8, 'o'], [7, 8, 'y'], [8, 8, 'y'],
  [7, 9, 'y'], [8, 9, 'o'],
  [7, 10, 'o'],
  [8, 11, 'r'],
]);
const flame3: Matrix = setPixels(e, [
  [6, 5, 'o'],
  [6, 6, 'y'], [7, 6, 'o'],
  [5, 7, 'o'], [6, 7, 'y'], [7, 7, 'y'],
  [6, 8, 'y'], [7, 8, 'y'], [8, 8, 'o'],
  [6, 9, 'o'], [7, 9, 'y'],
  [7, 10, 'o'],
  [7, 11, 'r'],
]);

// ── рыбья кость (валюта/дроп душ) ─────────────────────────────────────────
const fishbone1: Matrix = setPixels(e, [
  [4, 7, 'B'], [11, 6, 'B'],
  [3, 8, 'B'], [4, 8, 'B'], [5, 8, 'b'], [6, 8, 'B'], [7, 8, 'b'], [8, 8, 'B'],
  [9, 8, 'b'], [10, 8, 'B'], [11, 8, 'B'],
  [4, 9, 'B'], [11, 10, 'B'],
  [6, 6, 'b'], [8, 6, 'b'], [6, 10, 'b'], [8, 10, 'b'],
]);
const fishbone2: Matrix = setPixels(fishbone1, [
  [2, 5, 'w'], [13, 9, 'w'],
]);

// ── фляга ─────────────────────────────────────────────────────────────────
const flask: Matrix = setPixels(e, [
  [7, 5, 'B'], [8, 5, 'B'],
  [7, 6, 'B'], [8, 6, 'B'],
  [6, 7, 'B'], [7, 7, 'r'], [8, 7, 'r'], [9, 7, 'B'],
  [6, 8, 'B'], [7, 8, 'r'], [8, 8, 'r'], [9, 8, 'B'],
  [6, 9, 'B'], [7, 9, 'r'], [8, 9, 'r'], [9, 9, 'B'],
  [6, 10, 'B'], [7, 10, 'B'], [8, 10, 'B'], [9, 10, 'B'],
]);

// ── панель (источник 9-slice, границы 4px) ────────────────────────────────
function panelFrame(): Matrix {
  const rows = Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => '1'));
  for (let i = 0; i < 16; i++) {
    rows[0][i] = '3'; //  внешний обод
    rows[15][i] = '3';
    rows[i][0] = '3';
    rows[i][15] = '3';
    rows[1][i] = i < 2 || i > 13 ? '3' : 'f'; // блик сверху
    rows[14][i] = i < 2 || i > 13 ? '3' : '0'; // тень снизу
    if (i > 1 && i < 14) {
      rows[i][1] = '2';
      rows[i][14] = '0';
    }
  }
  return rows.map((r) => r.join(''));
}

// слот инвентаря: тонкая рамка, тёмный фон
function slotFrame(): Matrix {
  const rows = Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => '0'));
  for (let i = 0; i < 16; i++) {
    rows[0][i] = '2';
    rows[15][i] = '2';
    rows[i][0] = '2';
    rows[i][15] = '2';
  }
  rows[15][15] = '3';
  return rows.map((r) => r.join(''));
}

// курсор выбора: золотые уголки
function cursorFrame(): Matrix {
  const rows = Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => '.'));
  const corner = (cx: number, cy: number, dx: number, dy: number) => {
    for (let i = 0; i < 4; i++) {
      rows[cy][cx + i * dx] = 'y';
      rows[cy + i * dy][cx] = 'y';
    }
  };
  corner(0, 0, 1, 1);
  corner(15, 0, -1, 1);
  corner(0, 15, 1, -1);
  corner(15, 15, -1, -1);
  return rows.map((r) => r.join(''));
}

// маркеры NPC
const markerQuest = setPixels(e, [
  [7, 3, 'y'], [8, 3, 'y'], [7, 4, 'y'], [8, 4, 'y'], [7, 5, 'y'], [8, 5, 'y'],
  [7, 6, 'y'], [8, 6, 'y'], [7, 7, 'y'], [8, 7, 'y'],
  [7, 9, 'y'], [8, 9, 'y'], [7, 10, 'y'], [8, 10, 'y'],
]);
const markerDone = setPixels(e, [
  [6, 3, 'c'], [7, 3, 'c'], [8, 3, 'c'], [9, 3, 'c'],
  [5, 4, 'c'], [9, 4, 'c'], [10, 4, 'c'],
  [9, 5, 'c'], [8, 6, 'c'], [7, 7, 'c'],
  [7, 9, 'c'], [7, 10, 'c'],
]);

export const uiFrames: Matrix[] = [
  flame1, flame2, flame3, // 0-2
  fishbone1, fishbone2, //  3-4
  flask, //                 5
  panelFrame(), //          6  панель (9-slice, границы 4)
  slotFrame(), //           7  слот
  cursorFrame(), //         8  курсор
  markerQuest, //           9  «!» над NPC
  markerDone, //            10 «?» над NPC
];
