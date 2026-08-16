import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { STRINGS } from '../config/gameData';
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

    const press = uiText(this, cx, GAME_HEIGHT - 42, STRINGS.pressStart, UI.bone).setOrigin(0.5);
    this.tweens.add({
      targets: press,
      alpha: 0.2,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard!.once('keydown-ENTER', () => {
      this.scene.start('class-select');
    });
  }
}
