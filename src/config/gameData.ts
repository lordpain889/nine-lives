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
  rat: { idle: [24, 25], walk: [26, 27], windup: [28, 29], attack: [30], death: [31] },
  doctor: { idle: [32, 33], walk: [34, 35], windup: [36, 37], attack: [38], death: [39, 40] },
  wolf: { idle: [45, 46], walk: [47, 48], windup: [49, 50], attack: [51, 52], death: [53] },
  spirit: { idle: [54, 55], walk: [56, 57], windup: [58, 59], attack: [60], death: [61, 62] },
  skeleton: { idle: [63, 64], walk: [65, 66], windup: [67, 68], attack: [69, 70], death: [71] },
  fish: [19, 20],
  bolt: [21, 22],
  flask: [41, 42],
  cloud: [43, 44],
} as const;

// NPC (npcs.png)
export const NPC_FRAMES = {
  blacksmith: [0, 1],
  quartermaster: [2, 3],
  merchant: [4, 5],
} as const;

export const NPC_NAMES: Record<string, string> = {
  blacksmith: 'Кузнец Углелап',
  quartermaster: 'Квартирмейстер Шрам',
  merchant: 'Торговка Полночь',
};

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

export const CARDINAL_FRAMES = {
  idle: [15, 16],
  windup: [17, 18],
  cast: [19],
  summon: [20, 21],
  death: [22, 23, 24],
} as const;

export const CARDINAL = {
  nameRu: 'КАРДИНАЛ ЧУМНОГО СОБОРА',
  hp: 380,
  fan: { damage: 16, count: 3, spreadDeg: 22, speed: 110, windupMs: 700 },
  beam: { damage: 30, windupMs: 950, segments: 7, radius: 11 },
  summonCap: 4,
  teleportCooldownMs: 5200,
  actionGapMs: 1000,
  phase2At: 0.5,
  soulValue: 800,
};

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

// город (18+)
export const TOWN_TILES = {
  cobbleA: 18,
  cobbleB: 19,
  houseWall: 20,
  roof: 21,
  houseDoor: 22,
  houseWindow: 23,
  lantern: 24,
  stall: 25,
} as const;

export const TOWN_COLLIDING = [
  TOWN_TILES.houseWall,
  TOWN_TILES.roof,
  TOWN_TILES.houseDoor,
  TOWN_TILES.houseWindow,
  TOWN_TILES.stall,
];

// лес (26+)
export const FOREST_TILES = {
  denseTree: 26,
  stump: 27,
  bigShroom: 28,
} as const;

export const FOREST_COLLIDING = [FOREST_TILES.denseTree, FOREST_TILES.stump];

// катакомбы и собор (29+)
export const CRYPT_TILES = {
  stoneA: 29,
  stoneB: 30,
  brick: 31,
  bonePile: 32,
  spikesDown: 33,
  spikesUp: 34,
  checkerA: 35,
  checkerB: 36,
  pillar: 37,
  stained: 38,
} as const;

export const CRYPT_COLLIDING = [
  CRYPT_TILES.brick,
  CRYPT_TILES.bonePile,
  CRYPT_TILES.pillar,
  CRYPT_TILES.stained,
];

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
    drops: [
      { id: 'bone_hound', chance: 0.6, min: 1, max: 1 },
      { id: 'hide_rotten', chance: 0.25, min: 1, max: 1 },
    ],
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
    drops: [
      { id: 'wax', chance: 0.5, min: 1, max: 2 },
      { id: 'robe_scrap', chance: 0.3, min: 1, max: 1 },
    ],
  },
  rat: {
    key: 'rat',
    hp: 12,
    damage: 6,
    speed: 90,
    aggroRadius: 85,
    attackRange: 12,
    windupMs: 300,
    recoverMs: 400,
    kind: 'melee',
    soulValue: 4,
    drops: [{ id: 'rat_tail', chance: 0.7, min: 1, max: 1 }],
  },
  doctor: {
    key: 'doctor',
    hp: 45,
    damage: 12,
    speed: 40,
    aggroRadius: 115,
    attackRange: 85,
    windupMs: 800,
    recoverMs: 1100,
    kind: 'lob',
    soulValue: 35,
    drops: [
      { id: 'plague_vial', chance: 0.5, min: 1, max: 1 },
      { id: 'wax', chance: 0.3, min: 1, max: 1 },
    ],
  },
  wolf: {
    key: 'wolf',
    hp: 40,
    damage: 16,
    speed: 85,
    aggroRadius: 90,
    attackRange: 15,
    windupMs: 350,
    recoverMs: 550,
    kind: 'melee',
    soulValue: 18,
    drops: [
      { id: 'wolf_fang', chance: 0.6, min: 1, max: 1 },
      { id: 'wolf_hide', chance: 0.3, min: 1, max: 1 },
    ],
  },
  spirit: {
    key: 'spirit',
    hp: 30,
    damage: 14,
    speed: 45,
    aggroRadius: 125,
    attackRange: 100,
    windupMs: 650,
    recoverMs: 900,
    kind: 'projectile',
    soulValue: 30,
    drops: [{ id: 'spirit_essence', chance: 0.45, min: 1, max: 1 }],
  },
  skeleton: {
    key: 'skeleton',
    hp: 60,
    damage: 20,
    speed: 55,
    aggroRadius: 90,
    attackRange: 17,
    windupMs: 500,
    recoverMs: 650,
    kind: 'melee',
    soulValue: 40,
    behavior: { block: 0.4 },
    drops: [
      { id: 'bone_shard', chance: 0.6, min: 1, max: 1 },
      { id: 'rusty_metal', chance: 0.35, min: 1, max: 1 },
    ],
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
  controls: 'J удар  K перекат  H фляга  E действие',
  victorySub: 'чума отступает. девять жизней целы.',
  backToTitle: 'ENTER — на титул',
};
