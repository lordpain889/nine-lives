import type { ItemDef, InvEntry } from '../types';

// Реестр всех предметов. frame = индекс в items.png.

const M = (id: string, nameRu: string, descRu: string, frame: number): ItemDef => ({
  id,
  nameRu,
  descRu,
  type: 'material',
  frame,
  stack: 99,
});

export const ITEMS: Record<string, ItemDef> = {
  // ── материалы ──
  bone_hound: M('bone_hound', 'кость гончей', 'Ещё тёплая. Почему?', 0),
  hide_rotten: M('hide_rotten', 'гнилая шкура', 'Пахнет хуже, чем выглядит.', 1),
  wax: M('wax', 'свечной воск', 'Собран с погасших свечей.', 2),
  robe_scrap: M('robe_scrap', 'обрывок рясы', 'Ткань культа. Шепчет.', 3),
  rat_tail: M('rat_tail', 'крысиный хвост', 'Чумной, но целый.', 4),
  wolf_fang: M('wolf_fang', 'клык волка', 'Острее любого ножа.', 5),
  wolf_hide: M('wolf_hide', 'шкура волка', 'Тёплая и прочная.', 6),
  spirit_essence: M('spirit_essence', 'эссенция духа', 'Светится в темноте.', 7),
  bone_shard: M('bone_shard', 'осколок кости', 'Древний и твёрдый.', 8),
  rusty_metal: M('rusty_metal', 'ржавый металл', 'Перековать — и заживёт.', 9),
  plague_vial: M('plague_vial', 'склянка чумы', 'Не открывать. Никогда.', 10),
  warden_heart: M('warden_heart', 'сердце стража', 'Тяжёлое, как камень.', 11),
  cardinal_relic: M('cardinal_relic', 'реликвия кардинала', 'Тьма в золотой оправе.', 12),

  // ── стартовое оружие (статы «нулевые» — база класса) ──
  w_knight_start: { id: 'w_knight_start', nameRu: 'ржавый клинок', descRu: 'Служил ещё до чумы.', type: 'weapon', classKey: 'knight', frame: 13, stack: 1 },
  w_mage_start: { id: 'w_mage_start', nameRu: 'старый посох', descRu: 'Помнит лучшие заклинания.', type: 'weapon', classKey: 'mage', frame: 15, stack: 1 },
  w_merc_start: { id: 'w_merc_start', nameRu: 'щербатый нож', descRu: 'Дёшево и сердито.', type: 'weapon', classKey: 'mercenary', frame: 17, stack: 1 },
  w_ass_start: { id: 'w_ass_start', nameRu: 'когти-крюки', descRu: 'Бесшумные и быстрые.', type: 'weapon', classKey: 'assassin', frame: 19, stack: 1 },

  // ── сет рыцаря «Гробовая сталь» ──
  w_knight_set: { id: 'w_knight_set', nameRu: 'меч гробовой стали', descRu: 'Выкован из оград склепов.', type: 'weapon', classKey: 'knight', stats: { damage: 8 }, frame: 14, stack: 1 },
  a_knight_set: { id: 'a_knight_set', nameRu: 'панцирь гробовой стали', descRu: 'Тяжёлый, но надёжный.', type: 'armor', classKey: 'knight', stats: { hp: 30, speed: -5 }, frame: 21, stack: 1 },
  c_knight_set: { id: 'c_knight_set', nameRu: 'печать стража', descRu: 'Дыхание становится ровнее.', type: 'charm', classKey: 'knight', stats: { stamina: 15 }, frame: 25, stack: 1 },

  // ── сет мага «Шёпот глубин» ──
  w_mage_set: { id: 'w_mage_set', nameRu: 'посох шёпота глубин', descRu: 'Рыбы говорят с ним.', type: 'weapon', classKey: 'mage', stats: { damage: 7, cooldownMul: 0.85 }, frame: 16, stack: 1 },
  a_mage_set: { id: 'a_mage_set', nameRu: 'мантия глубин', descRu: 'Мокрая, но не промокает.', type: 'armor', classKey: 'mage', stats: { hp: 20 }, frame: 22, stack: 1 },
  c_mage_set: { id: 'c_mage_set', nameRu: 'око глубин', descRu: 'Видит сквозь туман.', type: 'charm', classKey: 'mage', stats: { stamina: 20 }, frame: 26, stack: 1 },

  // ── сет наёмника «Волчья стать» ──
  w_merc_set: { id: 'w_merc_set', nameRu: 'клинок волчьей стати', descRu: 'Режет как клык.', type: 'weapon', classKey: 'mercenary', stats: { damage: 6, cooldownMul: 0.9 }, frame: 18, stack: 1 },
  a_merc_set: { id: 'a_merc_set', nameRu: 'доспех волчьей стати', descRu: 'Из шкур вожаков.', type: 'armor', classKey: 'mercenary', stats: { hp: 25 }, frame: 23, stack: 1 },
  c_merc_set: { id: 'c_merc_set', nameRu: 'волчий тотем', descRu: 'Лапы сами несут.', type: 'charm', classKey: 'mercenary', stats: { speed: 8 }, frame: 27, stack: 1 },

  // ── сет асасина «Тень катакомб» ──
  w_ass_set: { id: 'w_ass_set', nameRu: 'когти тени', descRu: 'Тьма на кончиках.', type: 'weapon', classKey: 'assassin', stats: { damage: 5, cooldownMul: 0.8 }, frame: 20, stack: 1 },
  a_ass_set: { id: 'a_ass_set', nameRu: 'плащ катакомб', descRu: 'Сшит из тишины.', type: 'armor', classKey: 'assassin', stats: { hp: 15, speed: 5 }, frame: 24, stack: 1 },
  c_ass_set: { id: 'c_ass_set', nameRu: 'клык тьмы', descRu: 'Дыхание почти не тратится.', type: 'charm', classKey: 'assassin', stats: { staminaCostMul: 0.8 }, frame: 28, stack: 1 },

  // ── общие обереги ──
  charm_tails: { id: 'charm_tails', nameRu: 'оберег из хвостов', descRu: 'Девять хвостов — девять вдохов.', type: 'charm', stats: { stamina: 20 }, frame: 29, stack: 1 },
  charm_ember: { id: 'charm_ember', nameRu: 'тлеющий уголёк', descRu: 'Греет душу и тело.', type: 'charm', stats: { hp: 15 }, frame: 30, stack: 1 },

  // ── ключи ──
  key_catacombs: { id: 'key_catacombs', nameRu: 'ключ от катакомб', descRu: 'Вырезан из кости.', type: 'key', frame: 31, stack: 1 },
  key_cathedral: { id: 'key_cathedral', nameRu: 'ключ от собора', descRu: 'Золото, холодное как лёд.', type: 'key', frame: 32, stack: 1 },
};

export function itemById(id: string): ItemDef {
  const def = ITEMS[id];
  if (!def) throw new Error(`Unknown item: ${id}`);
  return def;
}

export const STARTER_WEAPONS: Record<string, string> = {
  knight: 'w_knight_start',
  mage: 'w_mage_start',
  mercenary: 'w_merc_start',
  assassin: 'w_ass_start',
};

// ── операции с инвентарём (массив InvEntry) ──────────────────────────────
export function addItem(inv: InvEntry[], id: string, qty = 1): void {
  const def = itemById(id);
  const entry = inv.find((e) => e.id === id);
  if (entry && def.stack > 1) {
    entry.qty = Math.min(def.stack, entry.qty + qty);
  } else {
    inv.push({ id, qty });
  }
}

export function removeItem(inv: InvEntry[], id: string, qty = 1): boolean {
  const idx = inv.findIndex((e) => e.id === id);
  if (idx < 0 || inv[idx].qty < qty) return false;
  inv[idx].qty -= qty;
  if (inv[idx].qty <= 0) inv.splice(idx, 1);
  return true;
}

export function countItem(inv: InvEntry[], id: string): number {
  return inv.filter((e) => e.id === id).reduce((s, e) => s + e.qty, 0);
}
