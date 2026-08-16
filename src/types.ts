export type ClassKey = 'knight' | 'mage' | 'mercenary' | 'assassin';

export interface ClassDef {
  key: ClassKey;
  nameRu: string;
  descRu: string;
  hp: number;
  stamina: number;
  speed: number;
  attack: {
    damage: number;
    staminaCost: number;
    range: number;
    kind: 'melee' | 'projectile';
    cooldownMs: number;
  };
  roll: {
    staminaCost: number;
    iframesMs: number;
    speed: number;
    durationMs: number;
  };
}

export interface DropDef {
  id: string; //   id предмета из ITEMS
  chance: number; // 0..1
  min: number;
  max: number;
}

export interface EnemyDef {
  key: string;
  hp: number;
  damage: number;
  speed: number;
  aggroRadius: number;
  attackRange: number;
  windupMs: number;
  recoverMs: number;
  kind: 'melee' | 'projectile' | 'lob'; // lob = склянка по дуге → облако
  soulValue: number;
  drops?: DropDef[];
}

export interface SpawnPoint {
  type: string;
  x: number; // в тайлах
  y: number;
}

// ─── Предметы и экипировка ───────────────────────────────────────────────
export type ItemType = 'material' | 'weapon' | 'armor' | 'charm' | 'consumable' | 'key';
export type EquipSlot = 'weapon' | 'armor' | 'charm';

export interface StatMods {
  damage?: number;
  hp?: number;
  stamina?: number;
  speed?: number;
  staminaCostMul?: number; // умножается, по умолчанию 1
  cooldownMul?: number;
}

export interface ItemDef {
  id: string;
  nameRu: string;
  descRu: string;
  type: ItemType;
  classKey?: ClassKey; // класс-лок для экипировки
  stats?: StatMods;
  frame: number; //     items.png
  stack: number; //     99 материалы, 1 экипировка
}

export interface InvEntry {
  id: string;
  qty: number;
}

// ─── Зоны ────────────────────────────────────────────────────────────────
export type ZoneKey = 'graveyard' | 'town' | 'forest' | 'catacombs' | 'cathedral';

export interface ExitDef {
  x: number; //  в тайлах
  y: number;
  w: number;
  h: number;
  toZone: ZoneKey;
  toX: number; // тайл появления в целевой зоне
  toY: number;
  lockFlag?: string; //     флаг сейва, без которого проход закрыт
  lockedTextRu?: string;
}

export interface ZoneAmbient {
  bgColor: string;
  tint?: { color: number; alpha: number };
  fogDensity: 0 | 1 | 2;
  particles: Array<'dust' | 'fireflies' | 'spores' | 'embers'>;
}

export interface ZoneDef {
  key: ZoneKey;
  nameRu: string;
  buildMap(): { ground: number[][]; decor: number[][] };
  spawns: SpawnPoint[];
  exits: ExitDef[];
  ambient: ZoneAmbient;
}

// ─── Сейв (localStorage; profileId — будущая серверная идентичность) ─────

export interface SaveGame {
  version: 1;
  profileId: string;
  updatedAt: number;
  classKey: ClassKey;
  souls: number;
  checkpoint: { zone: ZoneKey; shrineId: string }; // 'start' = точка входа зоны
  flags: string[];
  inventory: InvEntry[];
  equipment: Record<EquipSlot, string | null>;
  quests: Record<string, { state: 'active' | 'done' | 'turnedIn'; progress: number }>;
  droppedSouls: { zone: ZoneKey; x: number; y: number; amount: number } | null;
  stats: { deaths: number; kills: number; playtimeMs: number };
}
