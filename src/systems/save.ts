import type { ClassKey, SaveGame } from '../types';
import { STARTER_WEAPONS } from '../config/items';
import { emptyAttrs } from './leveling';

// Сейв — один ключ localStorage. Souls-подход: позиции и врагов не храним,
// загрузка всегда ставит к чекпоинт-алтарю с полным респавном.
// profileId — будущая серверная идентичность (асинхронный онлайн).

const KEY = 'nine-lives:save';

// Интерфейс на будущее: сервер станет вторым бэкендом без рефакторинга.
export interface SaveBackend {
  load(): SaveGame | null;
  store(save: SaveGame): void;
  clear(): void;
}

const localBackend: SaveBackend = {
  load(): SaveGame | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return migrate(JSON.parse(raw));
    } catch {
      return null;
    }
  },
  store(save: SaveGame): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(save));
    } catch {
      // квота/приватный режим — играем без сейва
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
  },
};

let backend: SaveBackend = localBackend;

function migrate(raw: unknown): SaveGame | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Omit<Partial<SaveGame>, 'version'> & { version?: number };
  switch (s.version) {
    case 1: {
      if (!s.classKey || !s.checkpoint) return null;
      // v1 → v2: имя, уровень, атрибуты
      const v2 = s as unknown as SaveGame;
      v2.version = 2;
      v2.name = v2.name ?? 'безымянный кот';
      v2.level = v2.level ?? 1;
      v2.attrs = v2.attrs ?? emptyAttrs();
      return v2;
    }
    case 2:
      if (!s.classKey || !s.checkpoint) return null;
      return s as SaveGame;
    default:
      return null; // неизвестная версия — новый забег
  }
}

export function newSave(classKey: ClassKey, name = 'безымянный кот'): SaveGame {
  const save: SaveGame = {
    version: 2,
    profileId: crypto.randomUUID(),
    updatedAt: Date.now(),
    name,
    level: 1,
    attrs: emptyAttrs(),
    classKey,
    souls: 0,
    checkpoint: { zone: 'graveyard', shrineId: 'start' },
    flags: [],
    // экипированные предметы НЕ лежат в инвентаре (снятие возвращает)
    inventory: [],
    equipment: { weapon: STARTER_WEAPONS[classKey], armor: null, charm: null },
    quests: {},
    droppedSouls: null,
    stats: { deaths: 0, kills: 0, playtimeMs: 0 },
  };
  return save;
}

export function loadSave(): SaveGame | null {
  return backend.load();
}

export function persist(save: SaveGame): void {
  save.updatedAt = Date.now();
  backend.store(save);
}

export function clearSave(): void {
  backend.clear();
}

export function hasFlag(save: SaveGame, flag: string): boolean {
  return save.flags.includes(flag);
}

export function setFlag(save: SaveGame, flag: string): void {
  if (!save.flags.includes(flag)) save.flags.push(flag);
}
