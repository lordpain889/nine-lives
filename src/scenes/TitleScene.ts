import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { STRINGS } from '../config/gameData';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    this.add
      .text(cx, 52, STRINGS.title, {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#c9a227',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 76, STRINGS.subtitle, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#6f6c8a',
      })
      .setOrigin(0.5);

    // свечи по бокам названия
    this.add.image(cx - 90, 52, 'tiles', 9);
    this.add.image(cx + 90, 52, 'tiles', 9);

    const press = this.add
      .text(cx, GAME_HEIGHT - 40, STRINGS.pressStart, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#d8cfc0',
      })
      .setOrigin(0.5);

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
