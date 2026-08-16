import { QUESTS, QuestDef, questById } from '../config/quests';
import { countItem, removeItem, addItem } from '../config/items';
import { setFlag } from './save';
import type { SaveGame, ZoneKey } from '../types';
import type { NpcKind } from '../entities/Npc';

// Состояние квестов живёт в save.quests: {state, progress}.

export type QuestState = 'active' | 'done' | 'turnedIn';

export function questState(save: SaveGame, id: string): QuestState | undefined {
  return save.quests[id]?.state;
}

export function questProgress(save: SaveGame, id: string): number {
  return save.quests[id]?.progress ?? 0;
}

// Первый не начатый квест этого NPC с выполненным prereq
export function availableQuest(save: SaveGame, npc: NpcKind): QuestDef | null {
  return (
    QUESTS.find(
      (q) =>
        q.giver === npc &&
        !save.quests[q.id] &&
        (!q.prereq || questState(save, q.prereq) === 'turnedIn'),
    ) ?? null
  );
}

// Активный (или готовый к сдаче) квест этого NPC
export function pendingQuest(save: SaveGame, npc: NpcKind): QuestDef | null {
  return (
    QUESTS.find((q) => {
      const st = questState(save, q.id);
      return q.giver === npc && (st === 'active' || st === 'done');
    }) ?? null
  );
}

export function acceptQuest(save: SaveGame, quest: QuestDef): void {
  save.quests[quest.id] = { state: 'active', progress: 0 };
  if (quest.unlocksFlag && quest.flagOn === 'accept') setFlag(save, quest.unlocksFlag);
}

// collect-квесты сверяются с инвентарём в момент разговора
export function isQuestDone(save: SaveGame, quest: QuestDef): boolean {
  const entry = save.quests[quest.id];
  if (!entry) return false;
  if (entry.state === 'done') return true;
  if (quest.type === 'collect') return countItem(save.inventory, quest.target) >= quest.count;
  return false;
}

// Сдать квест: забрать материалы (collect), выдать награды, флаг
export function turnInQuest(save: SaveGame, quest: QuestDef): void {
  if (quest.type === 'collect') {
    removeItem(save.inventory, quest.target, quest.count);
  }
  for (const item of quest.rewards.items ?? []) addItem(save.inventory, item.id, item.qty);
  save.quests[quest.id] = { state: 'turnedIn', progress: quest.count };
  if (quest.unlocksFlag && (quest.flagOn ?? 'turnIn') === 'turnIn') setFlag(save, quest.unlocksFlag);
}

// ── хуки прогресса ──
export function onEnemyKilled(save: SaveGame, enemyKey: string): string | null {
  for (const q of QUESTS) {
    const entry = save.quests[q.id];
    if (!entry || entry.state !== 'active') continue;
    if ((q.type === 'kill' && q.target === enemyKey) || (q.type === 'killBoss' && q.target === enemyKey)) {
      entry.progress = Math.min(q.count, entry.progress + 1);
      if (entry.progress >= q.count) {
        entry.state = 'done';
        return q.nameRu; // для баннера «выполнено»
      }
    }
  }
  return null;
}

export function onZoneReached(save: SaveGame, zone: ZoneKey): string | null {
  for (const q of QUESTS) {
    const entry = save.quests[q.id];
    if (!entry || entry.state !== 'active') continue;
    if (q.type === 'reachZone' && q.target === zone) {
      entry.progress = q.count;
      entry.state = 'done';
      return q.nameRu;
    }
  }
  return null;
}

// Строки прогресса для журнала
export function journalLines(save: SaveGame): Array<{ quest: QuestDef; state: QuestState; progress: number }> {
  return Object.entries(save.quests)
    .map(([id, entry]) => ({ quest: questById(id), state: entry.state, progress: entry.progress }))
    .sort((a, b) => (a.state === 'turnedIn' ? 1 : 0) - (b.state === 'turnedIn' ? 1 : 0));
}
