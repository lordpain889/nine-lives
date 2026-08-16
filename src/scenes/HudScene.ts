import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { STRINGS, UI_FRAMES, BOSS } from '../config/gameData';
import { uiText, setUiText, UI } from '../ui/text';

const BAR_W = 70;
const BAR_H = 5;
const MAX_FLASK_ICONS = 5;

export class HudScene extends Phaser.Scene {
  private bars!: Phaser.GameObjects.Graphics;
  private soulsText!: Phaser.GameObjects.BitmapText;
  private hintText!: Phaser.GameObjects.BitmapText;
  private bossName!: Phaser.GameObjects.BitmapText;
  private flaskIcons: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('hud');
  }

  create(): void {
    this.bars = this.add.graphics();
    this.soulsText = uiText(this, GAME_WIDTH - 16, GAME_HEIGHT - 13, '', UI.gold).setOrigin(1, 0);
    this.add.image(GAME_WIDTH - 9, GAME_HEIGHT - 9, 'ui', UI_FRAMES.fishbone[0]);
    this.hintText = uiText(this, GAME_WIDTH / 2, GAME_HEIGHT - 11, '', UI.fog).setOrigin(0.5, 0);

    this.flaskIcons = [];
    for (let i = 0; i < MAX_FLASK_ICONS; i++) {
      this.flaskIcons.push(this.add.image(12 + i * 10, 28, 'ui', UI_FRAMES.flask).setVisible(false));
    }

    this.bossName = uiText(this, GAME_WIDTH / 2, GAME_HEIGHT - 30, BOSS.nameRu, UI.bone)
      .setOrigin(0.5, 0)
      .setVisible(false);
  }

  update(): void {
    const r = this.registry;
    const hp = (r.get('hp') as number) ?? 0;
    const maxHp = (r.get('maxHp') as number) ?? 1;
    const st = (r.get('stamina') as number) ?? 0;
    const maxSt = (r.get('maxStamina') as number) ?? 1;
    const souls = (r.get('souls') as number) ?? 0;
    const flasks = (r.get('flasks') as number) ?? 0;

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

    setUiText(this.soulsText, `${STRINGS.souls}: ${souls}`);
    setUiText(this.hintText, (r.get('hint') as string) ?? '');
    this.flaskIcons.forEach((icon, i) => icon.setVisible(i < flasks));

    // босс-бар
    const bossActive = (r.get('bossActive') as boolean) ?? false;
    this.bossName.setVisible(bossActive);
    if (bossActive) {
      setUiText(this.bossName, (r.get('bossName') as string) ?? BOSS.nameRu);
      const bHp = (r.get('bossHp') as number) ?? 0;
      const bMax = (r.get('bossMaxHp') as number) ?? 1;
      const w = 160;
      g.fillStyle(0x0d0a14, 0.8);
      g.fillRect(GAME_WIDTH / 2 - w / 2 - 1, GAME_HEIGHT - 22, w + 2, 6);
      g.fillStyle(0x8c2233, 1);
      g.fillRect(GAME_WIDTH / 2 - w / 2, GAME_HEIGHT - 21, Math.max(0, (w * bHp) / bMax), 4);
    }
  }
}
