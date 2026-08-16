import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { STRINGS } from '../config/gameData';

const BAR_W = 70;
const BAR_H = 5;

export class HudScene extends Phaser.Scene {
  private bars!: Phaser.GameObjects.Graphics;
  private soulsText!: Phaser.GameObjects.Text;

  constructor() {
    super('hud');
  }

  create(): void {
    this.bars = this.add.graphics();
    this.soulsText = this.add
      .text(GAME_WIDTH - 6, GAME_HEIGHT - 12, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#c9a227',
      })
      .setOrigin(1, 0);
  }

  update(): void {
    const r = this.registry;
    const hp = (r.get('hp') as number) ?? 0;
    const maxHp = (r.get('maxHp') as number) ?? 1;
    const st = (r.get('stamina') as number) ?? 0;
    const maxSt = (r.get('maxStamina') as number) ?? 1;
    const souls = (r.get('souls') as number) ?? 0;

    const g = this.bars;
    g.clear();
    // подложки
    g.fillStyle(0x0d0a14, 0.8);
    g.fillRect(6, 6, BAR_W + 2, BAR_H + 2);
    g.fillRect(6, 14, BAR_W + 2, BAR_H + 2);
    // HP — кровь
    g.fillStyle(0x8c2233, 1);
    g.fillRect(7, 7, Math.max(0, (BAR_W * hp) / maxHp), BAR_H);
    // стамина — проклятая зелень
    g.fillStyle(0x3e7a4e, 1);
    g.fillRect(7, 15, Math.max(0, (BAR_W * st) / maxSt), BAR_H);

    this.soulsText.setText(`${STRINGS.souls}: ${souls}`);
  }
}
