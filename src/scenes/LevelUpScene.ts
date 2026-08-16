import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { ATTRS, levelCost } from '../systems/leveling';
import { persist } from '../systems/save';
import { addPanel } from '../ui/panel';
import { uiText, setUiText, UI } from '../ui/text';
import type { SaveGame } from '../types';
import type { GameScene } from './GameScene';

// «Развитие» у алтаря: души → уровень → +1 атрибут. Как у костра в DS.
export class LevelUpScene extends Phaser.Scene {
  private save!: SaveGame;
  private cursor = 0;
  private rows: Phaser.GameObjects.BitmapText[] = [];
  private header!: Phaser.GameObjects.BitmapText;
  private costText!: Phaser.GameObjects.BitmapText;
  private hintText!: Phaser.GameObjects.BitmapText;

  constructor() {
    super('levelup');
  }

  create(): void {
    this.save = this.registry.get('save') as SaveGame;
    this.cursor = 0;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0d0a14, 0.85).setOrigin(0);
    uiText(this, GAME_WIDTH / 2, 14, 'развитие', UI.gold, 2).setOrigin(0.5);
    this.header = uiText(this, GAME_WIDTH / 2, 34, '', UI.bone).setOrigin(0.5);
    this.costText = uiText(this, GAME_WIDTH / 2, 46, '', UI.cyan).setOrigin(0.5);

    addPanel(this, 24, 58, GAME_WIDTH - 48, 78);
    this.rows = ATTRS.map((_, i) => uiText(this, 34, 68 + i * 16, '', UI.bone));

    this.hintText = uiText(this, GAME_WIDTH / 2, GAME_HEIGHT - 26, 'ENTER — вложить души   ESC/E — уйти', UI.fog).setOrigin(0.5);

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-ENTER', () => this.levelUp());
    const close = () => {
      this.scene.stop();
      this.scene.resume('game');
    };
    kb.on('keydown-ESC', close);
    kb.on('keydown-E', close);

    this.refresh();
  }

  private move(dir: number): void {
    this.cursor = Phaser.Math.Wrap(this.cursor + dir, 0, ATTRS.length);
    this.refresh();
  }

  private levelUp(): void {
    const souls = (this.registry.get('souls') as number) ?? 0;
    const cost = levelCost(this.save.level);
    if (souls < cost) {
      setUiText(this.hintText, 'мало костей. вернись с добычей.');
      this.hintText.setTint(UI.blood);
      return;
    }
    const attr = ATTRS[this.cursor];
    this.save.attrs[attr.key] += 1;
    this.save.level += 1;
    this.registry.set('souls', souls - cost);
    this.save.souls = souls - cost;
    persist(this.save);

    const game = this.scene.get('game') as GameScene;
    game.player.recomputeStats();
    this.cameras.main.flash(200, 201, 162, 39, false);
    this.refresh();
  }

  private refresh(): void {
    const souls = (this.registry.get('souls') as number) ?? 0;
    const cost = levelCost(this.save.level);
    setUiText(this.header, `${this.save.name} — уровень ${this.save.level}`);
    setUiText(this.costText, `кости: ${souls}   след. уровень: ${cost}`);
    this.costText.setTint(souls >= cost ? UI.cyan : UI.blood);
    this.hintText.setTint(UI.fog);
    setUiText(this.hintText, 'ENTER — вложить души   ESC/E — уйти');

    ATTRS.forEach((a, i) => {
      const cur = i === this.cursor ? '> ' : '  ';
      setUiText(this.rows[i], `${cur}${a.nameRu} ${this.save.attrs[a.key]}  ${a.perPointRu}  (${a.descRu})`);
      this.rows[i].setTint(i === this.cursor ? UI.gold : 0xa89f94);
    });
  }
}
