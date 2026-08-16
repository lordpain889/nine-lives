// Charset пиксельного шрифта — ЕДИНСТВЕННЫЙ источник правды.
// Импортируется и генератором (tools), и игрой (src/ui/text.ts):
// порядок символов = порядок клеток в font.png.

export const FONT_CHARS_PER_ROW = 16;
export const FONT_CELL_W = 6;
export const FONT_CELL_H = 8;

export const FONT_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,:;!?-+/()«»×' +
  'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
