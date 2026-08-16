import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { RECIPES, RecipeDef } from '../config/recipes';
import { itemById, addItem, removeItem, countItem } from '../config/items';
import { persist } from '../systems/save';
import { addPanel } from '../ui/panel';
import { uiText, setUiText, UI } from '../ui/text';
import type { SaveGame } from '../types';

// Кузница/лавка: список рецептов, have/need по материалам, Enter — скрафтить.
export class CraftScene extends Phaser.Scene {
  private save!: SaveGame;
  private vendor: 'blacksmith' | 'merchant' = 'blacksmith';
  private recipes: RecipeDef[] = [];
  private cursor = 0;
  private rows: Phaser.GameObjects.BitmapText[] = [];
  private detail!: Phaser.GameObjects.BitmapText;
  private soulsText!: Phaser.GameObjects.BitmapText;

  constructor() {
    super('craft');
  }

  init(data: { vendor?: 'blacksmith' | 'merchant' }): void {
    this.vendor = data.vendor ?? 'blacksmith';
  }

  create(): void {
    this.save = this.registry.get('save') as SaveGame;
    // класс-локнутые вещи чужого класса не показываем — их нельзя надеть
    this.recipes = RECIPES.filter((r) => {
      if (r.vendor !== this.vendor) return false;
      const lock = itemById(r.resultId).classKey;
      return !lock || lock === this.save.classKey;
    });
    this.cursor = 0;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0d0a14, 0.82).setOrigin(0);
    uiText(this, GAME_WIDTH / 2, 12, this.vendor === 'blacksmith' ? 'кузница' : 'лавка', UI.gold, 2).setOrigin(0.5);
    this.soulsText = uiText(this, GAME_WIDTH - 14, 8, '', UI.cyan).setOrigin(1, 0);

    addPanel(this, 10, 26, GAME_WIDTH - 20, 104);
    this.rows = this.recipes.map((_, i) => uiText(this, 20, 34 + i * 11, '', UI.bone));

    addPanel(this, 10, 134, GAME_WIDTH - 20, 38);
    this.detail = uiText(this, 18, 141, '', UI.fog);

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-ENTER', () => this.craft());
    const close = () => {
      this.scene.stop();
      this.scene.resume('game');
    };
    kb.on('keydown-ESC', close);
    kb.on('keydown-E', close);

    this.refresh();
  }

  private move(dir: number): void {
    this.cursor = Phaser.Math.Wrap(this.cursor + dir, 0, this.recipes.length);
    this.refresh();
  }

  private canCraft(r: RecipeDef): boolean {
    const souls = (this.registry.get('souls') as number) ?? 0;
    if (souls < r.souls) return false;
    return r.materials.every((m) => countItem(this.save.inventory, m.id) >= m.qty);
  }

  private alreadyOwned(r: RecipeDef): boolean {
    const def = itemById(r.resultId);
    if (def.stack > 1) return false;
    return (
      countItem(this.save.inventory, r.resultId) > 0 ||
      Object.values(this.save.equipment).includes(r.resultId)
    );
  }

  private craft(): void {
    const r = this.recipes[this.cursor];
    if (!r || this.alreadyOwned(r) || !this.canCraft(r)) return;
    for (const m of r.materials) removeItem(this.save.inventory, m.id, m.qty);
    const souls = ((this.registry.get('souls') as number) ?? 0) - r.souls;
    this.registry.set('souls', souls);
    addItem(this.save.inventory, r.resultId);
    this.save.souls = souls;
    persist(this.save);
    this.refresh();
  }

  private refresh(): void {
    const souls = (this.registry.get('souls') as number) ?? 0;
    setUiText(this.soulsText, `кости: ${souls}`);

    this.recipes.forEach((r, i) => {
      const def = itemById(r.resultId);
      const owned = this.alreadyOwned(r);
      const ok = !owned && this.canCraft(r);
      const cur = i === this.cursor ? '> ' : '  ';
      setUiText(this.rows[i], `${cur}${def.nameRu}${owned ? ' — есть' : ''}`);
      this.rows[i].setTint(owned ? 0x4a4462 : ok ? 0xc9a227 : 0xa89f94);
    });

    const r = this.recipes[this.cursor];
    if (!r) return;
    const def = itemById(r.resultId);
    const mats = r.materials
      .map((m) => `${itemById(m.id).nameRu} ${countItem(this.save.inventory, m.id)}/${m.qty}`)
      .join('  ');
    setUiText(this.detail, `${def.descRu.replace(/\n/g, ' ')}\n${mats}${mats ? '  ' : ''}кости ${r.souls}`);
  }
}
