import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { itemById, addItem, removeItem } from '../config/items';
import { persist } from '../systems/save';
import { addPanel } from '../ui/panel';
import { uiText, setUiText, UI } from '../ui/text';
import type { EquipSlot, SaveGame } from '../types';
import type { GameScene } from './GameScene';

// Инвентарь-оверлей (Tab/I/Esc). Полностью с клавиатуры:
// стрелки — курсор, Enter — надеть/снять, вправо с края — слоты экипировки.

const COLS = 6;
const ROWS = 4;
const PAGE_SIZE = COLS * ROWS;
const CELL = 20;
const GRID_X = 18;
const GRID_Y = 40;
const EQUIP_X = 176;
const EQUIP_Y = [46, 74, 102];
const SLOTS: EquipSlot[] = ['weapon', 'armor', 'charm'];
const SLOT_LABELS = ['оружие', 'броня', 'амулет'];

export class InventoryScene extends Phaser.Scene {
  private save!: SaveGame;
  private page = 0; //    страница сетки (инвентарь не ограничен 24 слотами)
  private pageText!: Phaser.GameObjects.BitmapText;
  private cursor = 0; //  0..23 грид; 24..26 экипировка
  private cursorImg!: Phaser.GameObjects.Image;
  private gridIcons: Phaser.GameObjects.Image[] = [];
  private gridQty: Phaser.GameObjects.BitmapText[] = [];
  private equipIcons: Phaser.GameObjects.Image[] = [];
  private tipName!: Phaser.GameObjects.BitmapText;
  private tipDesc!: Phaser.GameObjects.BitmapText;
  private tipStats!: Phaser.GameObjects.BitmapText;
  private statsText!: Phaser.GameObjects.BitmapText;

  constructor() {
    super('inventory');
  }

  create(): void {
    this.save = this.registry.get('save') as SaveGame;
    this.cursor = 0;
    this.page = 0;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0d0a14, 0.82).setOrigin(0);
    uiText(this, GAME_WIDTH / 2, 14, 'инвентарь', UI.gold, 2).setOrigin(0.5);
    this.pageText = uiText(this, GRID_X, 26, '', UI.fog);

    // сетка предметов
    addPanel(this, GRID_X - 8, GRID_Y - 8, COLS * CELL + 16, ROWS * CELL + 12);
    this.gridIcons = [];
    this.gridQty = [];
    for (let i = 0; i < COLS * ROWS; i++) {
      const { x, y } = this.cellPos(i);
      this.add.image(x, y, 'ui', 7); // рамка слота
      this.gridIcons.push(this.add.image(x, y, 'items', 0).setVisible(false));
      this.gridQty.push(uiText(this, x + 8, y + 1, '', UI.bone).setOrigin(1, 0));
    }

    // экипировка
    addPanel(this, EQUIP_X - 12, GRID_Y - 8, 120, ROWS * CELL + 16);
    this.equipIcons = [];
    SLOTS.forEach((_, i) => {
      this.add.image(EQUIP_X, EQUIP_Y[i], 'ui', 7);
      uiText(this, EQUIP_X + 14, EQUIP_Y[i] - 4, SLOT_LABELS[i], UI.fog);
      this.equipIcons.push(this.add.image(EQUIP_X, EQUIP_Y[i], 'items', 0).setVisible(false));
    });
    this.statsText = uiText(this, EQUIP_X - 4, EQUIP_Y[2] + 18, '', UI.bone);

    // тултип (3 строки лора + строка статов)
    addPanel(this, 10, 122, GAME_WIDTH - 20, 52);
    this.tipName = uiText(this, 18, 127, '', UI.gold);
    this.tipDesc = uiText(this, 18, 138, '', UI.fog);
    this.tipStats = uiText(this, 18, 165, '', UI.green);

    this.cursorImg = this.add.image(0, 0, 'ui', 8);

    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT', () => this.move(-1, 0));
    kb.on('keydown-RIGHT', () => this.move(1, 0));
    kb.on('keydown-UP', () => this.move(0, -1));
    kb.on('keydown-DOWN', () => this.move(0, 1));
    kb.on('keydown-ENTER', () => this.activate());
    kb.on('keydown-OPEN_BRACKET', () => this.flipPage(-1));
    kb.on('keydown-CLOSED_BRACKET', () => this.flipPage(1));
    const close = (ev?: KeyboardEvent) => {
      ev?.preventDefault?.();
      this.scene.stop();
      this.scene.resume('game');
    };
    kb.on('keydown-TAB', close);
    kb.on('keydown-I', () => close());
    kb.on('keydown-ESC', () => close());

    this.refresh();
  }

  private cellPos(i: number): { x: number; y: number } {
    return {
      x: GRID_X + (i % COLS) * CELL + CELL / 2 - 2,
      y: GRID_Y + Math.floor(i / COLS) * CELL + CELL / 2 - 2,
    };
  }

  private move(dx: number, dy: number): void {
    if (this.cursor < COLS * ROWS) {
      const col = this.cursor % COLS;
      const row = Math.floor(this.cursor / COLS);
      if (dx > 0 && col === COLS - 1) {
        this.cursor = COLS * ROWS + Math.min(row, SLOTS.length - 1);
      } else {
        const nc = Phaser.Math.Clamp(col + dx, 0, COLS - 1);
        const nr = Phaser.Math.Clamp(row + dy, 0, ROWS - 1);
        this.cursor = nr * COLS + nc;
      }
    } else {
      const slot = this.cursor - COLS * ROWS;
      if (dx < 0) {
        this.cursor = Math.min(slot, ROWS - 1) * COLS + (COLS - 1);
      } else {
        this.cursor = COLS * ROWS + Phaser.Math.Clamp(slot + dy, 0, SLOTS.length - 1);
      }
    }
    this.refresh();
  }

  private flipPage(dir: number): void {
    this.page = Phaser.Math.Wrap(this.page + dir, 0, this.pageCount());
    this.refresh();
  }

  private slotIndex(cursor: number): number {
    return this.page * PAGE_SIZE + cursor;
  }

  private pageCount(): number {
    return Math.max(1, Math.ceil(this.save.inventory.length / PAGE_SIZE));
  }

  private selectedItemId(): string | null {
    if (this.cursor < PAGE_SIZE) {
      return this.save.inventory[this.slotIndex(this.cursor)]?.id ?? null;
    }
    return this.save.equipment[SLOTS[this.cursor - PAGE_SIZE]];
  }

  private activate(): void {
    const id = this.selectedItemId();
    if (!id) return;
    const def = itemById(id);

    if (this.cursor >= COLS * ROWS) {
      // снять
      const slot = SLOTS[this.cursor - COLS * ROWS];
      this.save.equipment[slot] = null;
      addItem(this.save.inventory, id);
      this.applyEquipChange();
      return;
    }

    if (def.type !== 'weapon' && def.type !== 'armor' && def.type !== 'charm') return;
    // страничный курсор → реальный индекс в инвентаре
    if (def.classKey && def.classKey !== this.save.classKey) {
      setUiText(this.tipStats, 'не для твоего класса');
      this.tipStats.setTint(UI.blood);
      return;
    }
    const slot = def.type as EquipSlot;
    removeItem(this.save.inventory, id);
    const prev = this.save.equipment[slot];
    if (prev) addItem(this.save.inventory, prev);
    this.save.equipment[slot] = id;
    this.applyEquipChange();
  }

  private applyEquipChange(): void {
    persist(this.save);
    const game = this.scene.get('game') as GameScene;
    game.player.recomputeStats();
    this.refresh();
  }

  private refresh(): void {
    // грид (с учётом страницы)
    this.page = Phaser.Math.Clamp(this.page, 0, this.pageCount() - 1);
    for (let i = 0; i < PAGE_SIZE; i++) {
      const entry = this.save.inventory[this.slotIndex(i)];
      this.gridIcons[i].setVisible(!!entry);
      if (entry) this.gridIcons[i].setFrame(itemById(entry.id).frame);
      setUiText(this.gridQty[i], entry && entry.qty > 1 ? String(entry.qty) : '');
    }
    setUiText(
      this.pageText,
      this.pageCount() > 1 ? `страница ${this.page + 1}/${this.pageCount()}  ([ ] листать)` : '',
    );
    // экипировка
    SLOTS.forEach((slot, i) => {
      const id = this.save.equipment[slot];
      this.equipIcons[i].setVisible(!!id);
      if (id) this.equipIcons[i].setFrame(itemById(id).frame);
    });
    // статы игрока
    const game = this.scene.get('game') as GameScene;
    const s = game.player.stats;
    setUiText(
      this.statsText,
      `атк ${s.damage}\nхп ${s.maxHp}\nвын ${Math.round(s.maxStamina)}\nскор ${s.speed}`,
    );

    // курсор
    if (this.cursor < COLS * ROWS) {
      const { x, y } = this.cellPos(this.cursor);
      this.cursorImg.setPosition(x, y);
    } else {
      this.cursorImg.setPosition(EQUIP_X, EQUIP_Y[this.cursor - COLS * ROWS]);
    }

    // тултип
    const id = this.selectedItemId();
    this.tipStats.setTint(UI.green);
    if (!id) {
      setUiText(this.tipName, '');
      setUiText(this.tipDesc, '');
      setUiText(this.tipStats, '');
      return;
    }
    const def = itemById(id);
    setUiText(this.tipName, def.nameRu);
    setUiText(this.tipDesc, def.descRu);
    const mods: string[] = [];
    if (def.stats?.damage) mods.push(`атк ${def.stats.damage > 0 ? '+' : ''}${def.stats.damage}`);
    if (def.stats?.hp) mods.push(`хп ${def.stats.hp > 0 ? '+' : ''}${def.stats.hp}`);
    if (def.stats?.stamina) mods.push(`вын ${def.stats.stamina > 0 ? '+' : ''}${def.stats.stamina}`);
    if (def.stats?.speed) mods.push(`скор ${def.stats.speed > 0 ? '+' : ''}${def.stats.speed}`);
    if (def.stats?.staminaCostMul) mods.push(`расход вын ×${def.stats.staminaCostMul}`);
    if (def.stats?.cooldownMul) mods.push(`перезарядка ×${def.stats.cooldownMul}`);
    if (def.classKey) mods.push(`(${def.classKey === this.save.classKey ? 'твой класс' : 'чужой класс'})`);
    setUiText(this.tipStats, mods.join('  '));
  }
}
