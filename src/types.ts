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
  kind: 'melee' | 'projectile';
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

// ─── Сейв (localStorage; profileId — будущая серверная идентичность) ─────
export type ZoneKey = 'graveyard' | 'town' | 'forest' | 'catacombs' | 'cathedral';

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
