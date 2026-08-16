import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConfig';
import { CLASSES, STRINGS } from '../config/gameData';

export class ClassSelectScene extends Phaser.Scene {
  private selected = 0;
  private cats: Phaser.GameObjects.Sprite[] = [];
  private frame!: Phaser.GameObjects.Rectangle;
  private nameText!: Phaser.GameObjects.Text;
  private descText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;

  constructor() {
    super('class-select');
  }

  create(): void {
    this.selected = 0;
    this.cats = [];
    const cx = GAME_WIDTH / 2;

    this.add
      .text(cx, 18, STRINGS.chooseClass, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#c9a227',
      })
      .setOrigin(0.5);

    // 4 кота в ряд, каждый в своей idle-анимации
    const spacing = 56;
    const startX = cx - spacing * 1.5;
    CLASSES.forEach((def, i) => {
      const cat = this.add.sprite(startX + i * spacing, 56, 'cats');
      cat.setScale(2);
      cat.play(`${def.key}-idle`);
      this.cats.push(cat);
    });

    this.frame = this.add
      .rectangle(this.cats[0].x, 56, 40, 40)
      .setStrokeStyle(1, 0xc9a227)
      .setFillStyle(0, 0);

    this.nameText = this.add
      .text(cx, 92, '', { fontFamily: 'monospace', fontSize: '12px', color: '#d8cfc0', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.descText = this.add
      .text(cx, 118, '', { fontFamily: 'monospace', fontSize: '8px', color: '#6f6c8a', align: 'center' })
      .setOrigin(0.5);
    this.statsText = this.add
      .text(cx, 150, '', { fontFamily: 'monospace', fontSize: '8px', color: '#a89f94' })
      .setOrigin(0.5);

    this.refresh();

    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT', () => this.move(-1));
    kb.on('keydown-RIGHT', () => this.move(1));
    kb.on('keydown-A', () => this.move(-1));
    kb.on('keydown-D', () => this.move(1));
    kb.on('keydown-ENTER', () => {
      this.registry.set('classKey', CLASSES[this.selected].key);
      this.scene.start('game');
    });
  }

  private move(dir: number): void {
    this.selected = Phaser.Math.Wrap(this.selected + dir, 0, CLASSES.length);
    this.refresh();
  }

  private refresh(): void {
    const def = CLASSES[this.selected];
    this.frame.setPosition(this.cats[this.selected].x, 56);
    this.nameText.setText(def.nameRu);
    this.descText.setText(def.descRu);
    this.statsText.setText(
      `HP ${def.hp}   выносливость ${def.stamina}   скорость ${def.speed}   урон ${def.attack.damage}`,
    );
  }
}
