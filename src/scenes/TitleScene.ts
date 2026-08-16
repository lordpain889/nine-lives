import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { STRINGS, classByKey } from '../config/gameData';
import { loadSave } from '../systems/save';
import { uiText, UI } from '../ui/text';

// Титул в духе DS: тёмная пелена, дрейфующий туман, дышащие угли, надгробия.
export class TitleScene extends Phaser.Scene {
  private fogA!: Phaser.GameObjects.TileSprite;
  private fogB!: Phaser.GameObjects.TileSprite;
  private t = 0;

  constructor() {
    super('title');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.cameras.main.setBackgroundColor('#0d0a14');
    // registry глобальный: без сброса новый забег стартует в последней зоне
    this.registry.remove('currentZone');

    // силуэты кладбища на горизонте (рисуем графикой — без фона тайлов)
    const g = this.add.graphics().setDepth(1);
    const groundY = GAME_HEIGHT - 26;
    g.fillStyle(0x1f1833, 1);
    g.fillRect(0, groundY, GAME_WIDTH, 26);
    const stone = (x: number, w: number, h: number) => {
      g.fillRect(x, groundY - h, w, h);
      g.fillRect(x + 1, groundY - h - 2, w - 2, 2); // скруглённая макушка
    };
    const cross = (x: number, h: number) => {
      g.fillRect(x, groundY - h, 2, h);
      g.fillRect(x - 3, groundY - h + 4, 8, 2);
    };
    const tree = (x: number, h: number) => {
      g.fillRect(x, groundY - h, 3, h);
      g.fillRect(x - 5, groundY - h + 4, 5, 2);
      g.fillRect(x + 3, groundY - h + 8, 6, 2);
      g.fillRect(x - 4, groundY - h + 12, 4, 2);
    };
    stone(18, 8, 14); cross(40, 18); stone(58, 10, 11); tree(86, 30);
    stone(112, 7, 9); cross(132, 15); stone(196, 9, 13); tree(220, 26);
    cross(248, 17); stone(266, 8, 10); stone(288, 11, 15); cross(306, 13);

    // туман двумя слоями
    this.fogA = this.add
      .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'fog')
      .setOrigin(0)
      .setAlpha(0.16);
    this.fogB = this.add
      .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'fog')
      .setOrigin(0)
      .setAlpha(0.1)
      .setTileScale(1.8);

    // заголовок с тенью
    uiText(this, cx + 1, 47, STRINGS.title, 0x0d0a14, 3).setOrigin(0.5);
    const title = uiText(this, cx, 46, STRINGS.title, UI.gold, 3).setOrigin(0.5);
    this.tweens.add({ targets: title, alpha: 0.82, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    uiText(this, cx, 70, STRINGS.subtitle, UI.fog).setOrigin(0.5);

    // угли-свечи по бокам с пульсирующим свечением
    for (const dx of [-104, 104]) {
      this.add.image(cx + dx, 48, 'tiles', 9);
      const g = this.add
        .image(cx + dx, 46, 'glow')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(0xc96b2e)
        .setScale(0.7)
        .setAlpha(0.55);
      this.tweens.add({
        targets: g,
        alpha: 0.3,
        scale: 0.58,
        duration: 1100 + Math.abs(dx),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // искры костра снизу
    this.add
      .particles(cx, GAME_HEIGHT + 4, 'particle', {
        lifespan: 3200,
        speedY: { min: -22, max: -10 },
        speedX: { min: -8, max: 8 },
        alpha: { values: [0, 0.7, 0] },
        quantity: 1,
        frequency: 260,
        tint: [0xc96b2e, 0xc9a227],
        blendMode: Phaser.BlendModes.ADD,
        emitZone: {
          source: new Phaser.Geom.Rectangle(-GAME_WIDTH / 2, 0, GAME_WIDTH, 6),
          type: 'random',
          quantity: 1,
        },
      })
      .setDepth(5);

    this.add.image(0, 0, 'vignette').setOrigin(0).setDepth(50);

    const save = loadSave();
    const kb = this.input.keyboard!;

    if (save) {
      const cls = classByKey(save.classKey);
      const press = uiText(
        this,
        cx,
        GAME_HEIGHT - 54,
        `ENTER — продолжить`,
        UI.bone,
      ).setOrigin(0.5).setDepth(60);
      uiText(this, cx, GAME_HEIGHT - 42, `${save.name}, ${cls.nameRu}, ур ${save.level}`, UI.gold)
        .setOrigin(0.5)
        .setDepth(60);
      uiText(this, cx, GAME_HEIGHT - 28, 'N — новый путь (сейв сотрётся)', UI.fog)
        .setOrigin(0.5)
        .setDepth(60);
      this.tweens.add({ targets: press, alpha: 0.25, duration: 900, yoyo: true, repeat: -1 });

      kb.once('keydown-ENTER', () => {
        this.registry.set('save', save);
        this.registry.set('classKey', save.classKey);
        this.scene.start('game');
      });
      kb.once('keydown-N', () => this.scene.start('class-select'));
    } else {
      const press = uiText(this, cx, GAME_HEIGHT - 42, STRINGS.pressStart, UI.bone)
        .setOrigin(0.5)
        .setDepth(60);
      this.tweens.add({ targets: press, alpha: 0.25, duration: 900, yoyo: true, repeat: -1 });
      kb.once('keydown-ENTER', () => this.scene.start('class-select'));
    }
  }

  update(_time: number, delta: number): void {
    this.t += delta;
    this.fogA.tilePositionX = this.t * 0.008;
    this.fogB.tilePositionX = -this.t * 0.013;
    this.fogB.tilePositionY = this.t * 0.003;
  }
}
