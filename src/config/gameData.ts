import type { ClassDef, EnemyDef } from '../types';

// ─── Классы котов ─────────────────────────────────────────────────────────
export const CLASSES: ClassDef[] = [
  {
    key: 'knight',
    nameRu: 'Рыцарь',
    descRu: 'Тяжёлая лапа, крепкая шкура.\nМедленный, но живучий.',
    hp: 120,
    stamina: 90,
    speed: 70,
    attack: { damage: 26, staminaCost: 30, range: 16, kind: 'melee', cooldownMs: 600 },
    roll: { staminaCost: 30, iframesMs: 280, speed: 160, durationMs: 320 },
  },
  {
    key: 'mage',
    nameRu: 'Маг',
    descRu: 'Спектральная рыба бьёт издали.\nШкура тонкая — не подпускай.',
    hp: 70,
    stamina: 100,
    speed: 80,
    attack: { damage: 20, staminaCost: 25, range: 120, kind: 'projectile', cooldownMs: 700 },
    roll: { staminaCost: 25, iframesMs: 300, speed: 170, durationMs: 320 },
  },
  {
    key: 'mercenary',
    nameRu: 'Наёмник',
    descRu: 'Баланс клинка и когтя.\nНадёжен в любой драке.',
    hp: 95,
    stamina: 100,
    speed: 85,
    attack: { damage: 18, staminaCost: 20, range: 14, kind: 'melee', cooldownMs: 450 },
    roll: { staminaCost: 22, iframesMs: 300, speed: 175, durationMs: 300 },
  },
  {
    key: 'assassin',
    nameRu: 'Асасин',
    descRu: 'Быстрые когти, длинный перекат.\nОдна ошибка — и девять жизней\nстанут восемью.',
    hp: 75,
    stamina: 110,
    speed: 95,
    attack: { damage: 14, staminaCost: 15, range: 12, kind: 'melee', cooldownMs: 300 },
    roll: { staminaCost: 15, iframesMs: 380, speed: 190, durationMs: 300 },
  },
];

export function classByKey(key: string): ClassDef {
  const def = CLASSES.find((c) => c.key === key);
  if (!def) throw new Error(`Unknown class: ${key}`);
  return def;
}

// ─── Кадры спрайтшита котов (столбцы; ряд = индекс класса в CLASSES) ─────
export const FRAMES_PER_CLASS = 26;
export const CAT_FRAMES = {
  idle: [0, 1],
  walkSide: [2, 3, 4, 5, 6, 7],
  walkDown: [8, 9, 10, 11],
  walkUp: [12, 13, 14, 15],
  attack: [16, 17, 18, 19],
  roll: [20, 21, 22, 23],
  death: [24, 25],
} as const;

// ─── Кадры спрайтшита врагов (enemies.png, один ряд) ─────────────────────
export const ENEMY_FRAMES = {
  gravehound: { idle: [0, 1], walk: [2, 23, 3, 23], windup: [4, 5], attack: [6, 7], death: [8, 9] },
  acolyte: { idle: [10, 11], walk: [12, 13], windup: [14, 15], attack: [16], death: [17, 18] },
  fish: [19, 20],
  bolt: [21, 22],
} as const;

// ─── Кадры ui.png ────────────────────────────────────────────────────────
export const UI_FRAMES = {
  flame: [0, 1, 2],
  fishbone: [3, 4],
  flask: 5,
} as const;

// ─── Босс: Graveyard Warden ──────────────────────────────────────────────
export const BOSS_FRAMES = {
  idle: [0, 1],
  walk: [2, 3],
  swipeWindup: [4, 5],
  swipe: [6, 7],
  slamWindup: [8, 9],
  slam: [10, 11],
  death: [12, 13, 14],
} as const;

export const BOSS = {
  nameRu: 'СТРАЖ КЛАДБИЩА',
  hp: 300,
  speed: 42,
  swipe: { damage: 24, range: 34, windupMs: 650, hitbox: 26 },
  slam: { damage: 32, range: 64, windupMs: 950, radius: 42 },
  recoverMs: 700,
  soulValue: 500,
  phase2At: 0.5, //   ниже этой доли HP — фаза 2
  phase2Speedup: 0.65, // множитель замахов в фазе 2
};

// ─── Тайлы (индексы в tiles.png) ─────────────────────────────────────────
export const TILES = {
  grassA: 0,
  grassB: 1,
  dirt: 2,
  gravestone: 3,
  wall: 4,
  wallTop: 5,
  fence: 6,
  void: 7,
  skull: 8,
  candle: 9,
  shrineBase: 10,
  tree: 11,
} as const;

export const COLLIDING_TILES = [
  TILES.gravestone,
  TILES.wall,
  TILES.wallTop,
  TILES.fence,
  TILES.void,
  TILES.tree,
];

// декор-слой (прозрачные, поверх земли, без коллизий)
export const DECOR = {
  tuftA: 12,
  tuftB: 13,
  crack: 14,
  pebbles: 15,
  bones: 16,
  shrooms: 17,
} as const;

// ─── Враги ────────────────────────────────────────────────────────────────
export const ENEMIES: Record<string, EnemyDef> = {
  gravehound: {
    key: 'gravehound',
    hp: 45,
    damage: 18,
    speed: 55,
    aggroRadius: 70,
    attackRange: 16,
    windupMs: 450,
    recoverMs: 500,
    kind: 'melee',
    soulValue: 10,
  },
  acolyte: {
    key: 'acolyte',
    hp: 35,
    damage: 14,
    speed: 40,
    aggroRadius: 110,
    attackRange: 90,
    windupMs: 700,
    recoverMs: 900,
    kind: 'projectile',
    soulValue: 25,
  },
};

// ─── Тюнинг ───────────────────────────────────────────────────────────────
export const TUNING = {
  staminaRegenPerSec: 45,
  staminaRegenDelayMs: 450,
  hitstopMs: 60,
  playerIframesAfterHitMs: 600,
  knockback: 120,
  flasks: 3,
  flaskHeal: 45,
};

export const STRINGS = {
  title: 'NINE LIVES',
  subtitle: 'пиксельное тёмное фентези о котах',
  pressStart: 'нажми ENTER',
  chooseClass: 'выбери своего кота',
  youDied: 'ВЫ УМЕРЛИ',
  victory: 'ВРАГ ПОВЕРЖЕН',
  souls: 'рыбьи кости',
  restHint: 'E — отдохнуть у алтаря',
  rested: 'алтарь принял тебя',
  soulsRecovered: 'кости возвращены',
  controls: 'WASD — ходьба   J — удар   K — перекат   H — фляга',
  victorySub: 'кладбище обрело покой. девять жизней целы.',
  backToTitle: 'ENTER — на титул',
};
