import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConfig';
import { classByKey } from '../config/gameData';
import { newSave, persist } from '../systems/save';
import { addPanel } from '../ui/panel';
import { uiText, setUiText, normalize, UI } from '../ui/text';
import type { ClassKey } from '../types';

const MAX_LEN = 12;
const ALLOWED = /^[a-zA-Zа-яА-ЯёЁ0-9 \-]$/;

// Ввод имени кота: печатаешь с клавиатуры, Enter — в путь.
export class NameEntryScene extends Phaser.Scene {
  private classKey: ClassKey = 'knight';
  private name = '';
  private nameText!: Phaser.GameObjects.BitmapText;
  private cursorVisible = true;

  constructor() {
    super('name-entry');
  }

  init(data: { classKey: ClassKey }): void {
    this.classKey = data.classKey ?? 'knight';
    this.name = '';
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const def = classByKey(this.classKey);

    uiText(this, cx, 30, 'имя твоего кота', UI.gold, 2).setOrigin(0.5);
    uiText(this, cx, 52, `(${def.nameRu} помнит его даже после смерти)`, UI.fog).setOrigin(0.5);

    // кот выбранного класса рядом с полем
    const classIndex = ['knight', 'mage', 'mercenary', 'assassin'].indexOf(this.classKey);
    this.add.sprite(cx - 78, 86, 'cats').setScale(2).play(`${this.classKey}-idle`);
    void classIndex;

    addPanel(this, cx - 60, 74, 150, 24);
    this.nameText = uiText(this, cx - 52, 82, '', UI.bone, 1);

    uiText(this, cx, 118, 'печатай имя  BACKSPACE стереть', UI.fog).setOrigin(0.5);
    uiText(this, cx, 132, 'ENTER — начать путь', UI.bone).setOrigin(0.5);

    this.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => {
        this.cursorVisible = !this.cursorVisible;
        this.refresh();
      },
    });

    this.input.keyboard!.on('keydown', (ev: KeyboardEvent) => {
      if (ev.key === 'Enter') {
        this.confirm();
      } else if (ev.key === 'Backspace') {
        this.name = this.name.slice(0, -1);
        this.refresh();
      } else if (ev.key.length === 1 && ALLOWED.test(ev.key) && this.name.length < MAX_LEN) {
        this.name += ev.key;
        this.refresh();
      }
    });

    this.refresh();
  }

  private refresh(): void {
    const display = normalize(this.name) + (this.cursorVisible ? '_' : ' ');
    setUiText(this.nameText, display);
  }

  private confirm(): void {
    const clean = this.name.trim();
    const finalName = clean.length ? clean : 'безымянный кот';
    const save = newSave(this.classKey, finalName.toLowerCase());
    persist(save);
    this.registry.set('save', save);
    this.registry.set('classKey', this.classKey);
    this.scene.start('game');
  }
}
