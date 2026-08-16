export interface RecipeDef {
  id: string;
  resultId: string;
  souls: number;
  materials: { id: string; qty: number }[];
  vendor: 'blacksmith' | 'merchant';
}

// Кузнец: сетовые вещи из материалов. Торговка: обереги за души.
export const RECIPES: RecipeDef[] = [
  // ── Гробовая сталь (рыцарь) ──
  { id: 'r_w_knight', resultId: 'w_knight_set', souls: 250, vendor: 'blacksmith', materials: [{ id: 'bone_hound', qty: 3 }, { id: 'rusty_metal', qty: 2 }] },
  { id: 'r_a_knight', resultId: 'a_knight_set', souls: 200, vendor: 'blacksmith', materials: [{ id: 'hide_rotten', qty: 3 }, { id: 'rusty_metal', qty: 1 }] },
  { id: 'r_c_knight', resultId: 'c_knight_set', souls: 150, vendor: 'blacksmith', materials: [{ id: 'warden_heart', qty: 1 }, { id: 'wax', qty: 3 }] },
  // ── Шёпот глубин (маг) ──
  { id: 'r_w_mage', resultId: 'w_mage_set', souls: 250, vendor: 'blacksmith', materials: [{ id: 'spirit_essence', qty: 2 }, { id: 'wax', qty: 3 }] },
  { id: 'r_a_mage', resultId: 'a_mage_set', souls: 200, vendor: 'blacksmith', materials: [{ id: 'robe_scrap', qty: 4 }, { id: 'spirit_essence', qty: 1 }] },
  { id: 'r_c_mage', resultId: 'c_mage_set', souls: 150, vendor: 'blacksmith', materials: [{ id: 'spirit_essence', qty: 3 }] },
  // ── Волчья стать (наёмник) ──
  { id: 'r_w_merc', resultId: 'w_merc_set', souls: 250, vendor: 'blacksmith', materials: [{ id: 'wolf_fang', qty: 3 }, { id: 'rusty_metal', qty: 1 }] },
  { id: 'r_a_merc', resultId: 'a_merc_set', souls: 200, vendor: 'blacksmith', materials: [{ id: 'wolf_hide', qty: 3 }, { id: 'hide_rotten', qty: 2 }] },
  { id: 'r_c_merc', resultId: 'c_merc_set', souls: 150, vendor: 'blacksmith', materials: [{ id: 'wolf_fang', qty: 2 }, { id: 'rat_tail', qty: 4 }] },
  // ── Тень катакомб (асасин) ──
  { id: 'r_w_ass', resultId: 'w_ass_set', souls: 250, vendor: 'blacksmith', materials: [{ id: 'bone_shard', qty: 3 }, { id: 'plague_vial', qty: 1 }] },
  { id: 'r_a_ass', resultId: 'a_ass_set', souls: 200, vendor: 'blacksmith', materials: [{ id: 'robe_scrap', qty: 3 }, { id: 'bone_shard', qty: 2 }] },
  { id: 'r_c_ass', resultId: 'c_ass_set', souls: 150, vendor: 'blacksmith', materials: [{ id: 'plague_vial', qty: 2 }, { id: 'rat_tail', qty: 3 }] },
  // ── лавка торговки ──
  { id: 'r_charm_tails', resultId: 'charm_tails', souls: 180, vendor: 'merchant', materials: [] },
  { id: 'r_charm_ember', resultId: 'charm_ember', souls: 140, vendor: 'merchant', materials: [] },
];
