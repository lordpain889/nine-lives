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
  bone_hound: M('bone_hound', 'кость гончей', 'Ещё тёплая, хотя пёс умер\nзадолго до чумы. Кузнец говорит:\nтакие кости держат заклад лучше стали.', 0),
  hide_rotten: M('hide_rotten', 'гнилая шкура', 'Слезает с костей сама, будто\nустала держаться. Дубится плохо,\nно от когтей укроет.', 1),
  wax: M('wax', 'свечной воск', 'Снят с поминальных свечей.\nВ нём остались чужие просьбы —\nоттого он и не тает в лапах.', 2),
  robe_scrap: M('robe_scrap', 'обрывок рясы', 'Ткань культа крысиных проповедников.\nЕсли поднести к уху, слышно, как\nкто-то дочитывает молитву.', 3),
  rat_tail: M('rat_tail', 'крысиный хвост', 'Городская валюта до костей.\nЗа десяток таких раньше давали хлеб,\nтеперь — только благодарность.', 4),
  wolf_fang: M('wolf_fang', 'клык волка', 'Волки в чаще не воют на луну.\nЛуны там не видно. Они воют\nна то, что глубже.', 5),
  wolf_hide: M('wolf_hide', 'шкура волка', 'Тёплая даже снятая.\nОхотники говорят: волк греет хозяина,\nпока помнит, кто его убил.', 6),
  spirit_essence: M('spirit_essence', 'эссенция духа', 'Свет, который остаётся,\nкогда кота уже нет.\nХолодный на ощупь и на совесть.', 7),
  bone_shard: M('bone_shard', 'осколок кости', 'Из катакомб, где кости старше\nимён. Режет плоть неохотно,\nа камень — с радостью.', 8),
  rusty_metal: M('rusty_metal', 'ржавый металл', 'Обломок ограды склепа.\nРжавчина здесь не портит железо,\nа лишь показывает его возраст.', 9),
  plague_vial: M('plague_vial', 'склянка чумы', 'Доктора носили её у сердца.\nНе открывать. Не нюхать.\nНе спрашивать, зачем носили.', 10),
  warden_heart: M('warden_heart', 'сердце стража', 'Камень, который бился\nвосемь сотен лет. Тёплый.\nЕсли прижать к груди — стучит.', 11),
  cardinal_relic: M('cardinal_relic', 'реликвия кардинала', 'Золото, обнявшее тьму.\nОн звонил в неё девять раз,\nи девять улиц перестали дышать.', 12),

  // ── стартовое оружие (статы «нулевые» — база класса) ──
  w_knight_start: { id: 'w_knight_start', nameRu: 'ржавый клинок', descRu: 'Служил городской страже, пока\nстража служила городу. Зазубрин\nбольше, чем у него было хозяев.', type: 'weapon', classKey: 'knight', frame: 13, stack: 1 },
  w_mage_start: { id: 'w_mage_start', nameRu: 'старый посох', descRu: 'Дерево из сада, которого\nбольше нет. Помнит заклинания\nлучше, чем ты — их слова.', type: 'weapon', classKey: 'mage', frame: 15, stack: 1 },
  w_merc_start: { id: 'w_merc_start', nameRu: 'щербатый нож', descRu: 'Куплен за две рыбьи головы\nу кота, которому уже было\nвсё равно, чем платят.', type: 'weapon', classKey: 'mercenary', frame: 17, stack: 1 },
  w_ass_start: { id: 'w_ass_start', nameRu: 'когти-крюки', descRu: 'Надеваются поверх лап.\nБесшумны настолько, что хозяин\nиногда забывает, что вооружён.', type: 'weapon', classKey: 'assassin', frame: 19, stack: 1 },

  // ── сет рыцаря «Гробовая сталь» ──
  w_knight_set: { id: 'w_knight_set', nameRu: 'меч гробовой стали', descRu: 'Перекован из оград склепов.\nДержит удар мертвеца, потому что\nсам однажды сторожил мёртвых.', type: 'weapon', classKey: 'knight', stats: { damage: 8 }, frame: 14, stack: 1 },
  a_knight_set: { id: 'a_knight_set', nameRu: 'панцирь гробовой стали', descRu: 'Тяжёл, как надгробие,\nи так же неохотно двигается.\nЗато под ним ничего не слышно.', type: 'armor', classKey: 'knight', stats: { hp: 30, speed: -5 }, frame: 21, stack: 1 },
  c_knight_set: { id: 'c_knight_set', nameRu: 'печать стража', descRu: 'Оттиск лапы, которой уже нет.\nДыхание под ней ровнее —\nсловно кто-то дышит за тебя.', type: 'charm', classKey: 'knight', stats: { stamina: 15 }, frame: 25, stack: 1 },

  // ── сет мага «Шёпот глубин» ──
  w_mage_set: { id: 'w_mage_set', nameRu: 'посох шёпота глубин', descRu: 'На конце — рыбий позвонок.\nРыбы под водой говорят без умолку;\nпосох лишь передаёт слова.', type: 'weapon', classKey: 'mage', stats: { damage: 7, cooldownMul: 0.85 }, frame: 16, stack: 1 },
  a_mage_set: { id: 'a_mage_set', nameRu: 'мантия глубин', descRu: 'Всегда влажная и никогда мокрая.\nВ карманах находят чешую,\nхотя хозяин не подходил к воде.', type: 'armor', classKey: 'mage', stats: { hp: 20 }, frame: 22, stack: 1 },
  c_mage_set: { id: 'c_mage_set', nameRu: 'око глубин', descRu: 'Смотрит сквозь туман\nи иногда — сквозь того,\nкто носит его на шее.', type: 'charm', classKey: 'mage', stats: { stamina: 20 }, frame: 26, stack: 1 },

  // ── сет наёмника «Волчья стать» ──
  w_merc_set: { id: 'w_merc_set', nameRu: 'клинок волчьей стати', descRu: 'В рукояти — клык вожака.\nБьёт коротко и часто, как учит\nстая: не сила, а счёт ударов.', type: 'weapon', classKey: 'mercenary', stats: { damage: 6, cooldownMul: 0.9 }, frame: 18, stack: 1 },
  a_merc_set: { id: 'a_merc_set', nameRu: 'доспех волчьей стати', descRu: 'Сшит из шкур троих вожаков.\nВолки чуют его издалека\nи не могут решить: свой или добыча.', type: 'armor', classKey: 'mercenary', stats: { hp: 25 }, frame: 23, stack: 1 },
  c_merc_set: { id: 'c_merc_set', nameRu: 'волчий тотем', descRu: 'Кость, обмотанная жилой.\nЛапы сами несут вперёд —\nостановиться труднее, чем бежать.', type: 'charm', classKey: 'mercenary', stats: { speed: 8 }, frame: 27, stack: 1 },

  // ── сет асасина «Тень катакомб» ──
  w_ass_set: { id: 'w_ass_set', nameRu: 'когти тени', descRu: 'Заточены об камень катакомб.\nНа кончиках темнота, которая\nне смывается и не сохнет.', type: 'weapon', classKey: 'assassin', stats: { damage: 5, cooldownMul: 0.8 }, frame: 20, stack: 1 },
  a_ass_set: { id: 'a_ass_set', nameRu: 'плащ катакомб', descRu: 'Сшит из тишины подземелий.\nШагов в нём не слышно —\nдаже собственных.', type: 'armor', classKey: 'assassin', stats: { hp: 15, speed: 5 }, frame: 24, stack: 1 },
  c_ass_set: { id: 'c_ass_set', nameRu: 'клык тьмы', descRu: 'Дыхание в нём почти не тратится.\nСтарые убийцы говорили:\nмёртвым дышать вообще не нужно.', type: 'charm', classKey: 'assassin', stats: { staminaCostMul: 0.8 }, frame: 28, stack: 1 },

  // ── общие обереги ──
  charm_tails: { id: 'charm_tails', nameRu: 'оберег из хвостов', descRu: 'Девять хвостов на одном шнурке.\nДевять вдохов сверх положенного —\nи девять чужих смертей в придачу.', type: 'charm', stats: { stamina: 20 }, frame: 29, stack: 1 },
  charm_ember: { id: 'charm_ember', nameRu: 'тлеющий уголёк', descRu: 'Взят из первого алтаря.\nГреет ровно столько, сколько нужно,\nчтобы не забыть, что ты жив.', type: 'charm', stats: { hp: 15 }, frame: 30, stack: 1 },

  // ── ключи ──
  key_catacombs: { id: 'key_catacombs', nameRu: 'ключ от катакомб', descRu: 'Вырезан из кости и эссенции духа.\nОткрывает замки, которые ставили\nне от воров, а от того, что внутри.', type: 'key', frame: 31, stack: 1 },
  key_cathedral: { id: 'key_cathedral', nameRu: 'ключ от собора', descRu: 'Золото, холодное как лёд.\nКардинал раздал девять таких.\nВосемь вернулись без хозяев.', type: 'key', frame: 32, stack: 1 },
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
