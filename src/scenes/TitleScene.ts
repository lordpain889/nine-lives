import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { STRINGS, classByKey } from '../config/gameData';
import { loadSave } from '../systems/save';
import { uiText, UI } from '../ui/text';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    uiText(this, cx, 46, STRINGS.title, UI.gold, 3).setOrigin(0.5);
    uiText(this, cx, 72, STRINGS.subtitle, UI.fog).setOrigin(0.5);

    // свечи по бокам названия
    this.add.image(cx - 96, 46, 'tiles', 9);
    this.add.image(cx + 96, 46, 'tiles', 9);

    const save = loadSave();
    const kb = this.input.keyboard!;

    if (save) {
      const cls = classByKey(save.classKey);
      const press = uiText(
        this,
        cx,
        GAME_HEIGHT - 52,
        `ENTER — продолжить (${cls.nameRu}, кости: ${save.souls})`,
        UI.bone,
      ).setOrigin(0.5);
      uiText(this, cx, GAME_HEIGHT - 38, 'N — новый путь', UI.fog).setOrigin(0.5);
      this.tweens.add({ targets: press, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });

      kb.once('keydown-ENTER', () => {
        this.registry.set('save', save);
        this.registry.set('classKey', save.classKey);
        this.scene.start('game');
      });
      kb.once('keydown-N', () => this.scene.start('class-select'));
    } else {
      const press = uiText(this, cx, GAME_HEIGHT - 42, STRINGS.pressStart, UI.bone).setOrigin(0.5);
      this.tweens.add({ targets: press, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });
      kb.once('keydown-ENTER', () => this.scene.start('class-select'));
    }
  }
}
