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
}

export interface SpawnPoint {
  type: string;
  x: number; // в тайлах
  y: number;
}
