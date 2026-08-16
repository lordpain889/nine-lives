import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConfig';
import { CLASSES, STRINGS } from '../config/gameData';
import { newSave, persist } from '../systems/save';
import { uiText, setUiText, UI } from '../ui/text';

export class ClassSelectScene extends Phaser.Scene {
  private selected = 0;
  private cats: Phaser.GameObjects.Sprite[] = [];
  private frame!: Phaser.GameObjects.Image;
  private nameText!: Phaser.GameObjects.BitmapText;
  private descText!: Phaser.GameObjects.BitmapText;
  private statsText!: Phaser.GameObjects.BitmapText;

  constructor() {
    super('class-select');
  }

  create(): void {
    this.selected = 0;
    this.cats = [];
    const cx = GAME_WIDTH / 2;

    uiText(this, cx, 14, STRINGS.chooseClass, UI.gold).setOrigin(0.5);

    // 4 кота в ряд, каждый в своей idle-анимации
    const spacing = 56;
    const startX = cx - spacing * 1.5;
    CLASSES.forEach((def, i) => {
      const cat = this.add.sprite(startX + i * spacing, 52, 'cats');
      cat.setScale(2);
      cat.play(`${def.key}-idle`);
      this.cats.push(cat);
    });

    this.frame = this.add.image(this.cats[0].x, 52, 'ui', 8).setScale(2.5);

    this.nameText = uiText(this, cx, 86, '', UI.bone, 2).setOrigin(0.5);
    this.descText = uiText(this, cx, 112, '', UI.fog).setOrigin(0.5).setCenterAlign();
    this.statsText = uiText(this, cx, 150, '', UI.bone).setOrigin(0.5);

    this.refresh();

    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT', () => this.move(-1));
    kb.on('keydown-RIGHT', () => this.move(1));
    kb.on('keydown-A', () => this.move(-1));
    kb.on('keydown-D', () => this.move(1));
    kb.on('keydown-ENTER', () => {
      const classKey = CLASSES[this.selected].key;
      const save = newSave(classKey);
      persist(save);
      this.registry.set('save', save);
      this.registry.set('classKey', classKey);
      this.scene.start('game');
    });
  }

  private move(dir: number): void {
    this.selected = Phaser.Math.Wrap(this.selected + dir, 0, CLASSES.length);
    this.refresh();
  }

  private refresh(): void {
    const def = CLASSES[this.selected];
    this.frame.setPosition(this.cats[this.selected].x, 52);
    setUiText(this.nameText, def.nameRu);
    setUiText(this.descText, def.descRu);
    setUiText(
      this.statsText,
      `HP ${def.hp}  выносл ${def.stamina}  скор ${def.speed}  урон ${def.attack.damage}`,
    );
  }
}
