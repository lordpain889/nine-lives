import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { addPanel } from './panel';
import { uiText, setUiText, UI } from './text';

export interface DialogChoice {
  label: string;
  cb: () => void;
}

export interface DialogConfig {
  name: string;
  pages: string[]; //   страницы уже свёрстаны \n
  choices?: DialogChoice[]; // показываются после последней страницы
}

// Диалоговое окно внизу экрана. Enter — дальше, стрелки — выбор.
// Пока открыто, registry 'dialogOpen' = true (Player стоит).
export class DialogBox {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;
  private nameText!: Phaser.GameObjects.BitmapText;
  private pageText!: Phaser.GameObjects.BitmapText;
  private choiceTexts: Phaser.GameObjects.BitmapText[] = [];
  private cfg!: DialogConfig;
  private page = 0;
  private choiceIdx = 0;
  private keys: Phaser.Input.Keyboard.Key[] = [];
  private onEnter: (() => void) | null = null;
  private onUp: (() => void) | null = null;
  private onDown: (() => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  get isOpen(): boolean {
    return this.container !== null;
  }

  open(cfg: DialogConfig): void {
    if (this.container) this.close();
    this.cfg = cfg;
    this.page = 0;
    this.choiceIdx = 0;
    this.scene.registry.set('dialogOpen', true);

    const h = 52;
    const panel = addPanel(this.scene, 8, GAME_HEIGHT - h - 6, GAME_WIDTH - 16, h);
    this.nameText = uiText(this.scene, 16, GAME_HEIGHT - h, cfg.name, UI.gold);
    this.pageText = uiText(this.scene, 16, GAME_HEIGHT - h + 11, '', UI.bone);
    this.container = this.scene.add.container(0, 0, [panel, this.nameText, this.pageText]);
    this.container.setDepth(9700).setScrollFactor(0);
    panel.setScrollFactor(0);
    this.nameText.setScrollFactor(0);
    this.pageText.setScrollFactor(0);

    // ВАЖНО: kb.addKey возвращает УЖЕ существующий Key (тот же объект, что у
    // Player/GameScene). Удалять его через removeKey нельзя — навсегда убьёт
    // клавишу для всей сцены. Поэтому только addListener/removeAllListeners.
    const kb = this.scene.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    const enter = kb.addKey(K.ENTER, false);
    const up = kb.addKey(K.UP, false);
    const down = kb.addKey(K.DOWN, false);
    this.keys = [enter, up, down];
    this.onEnter = () => this.advance();
    this.onUp = () => this.moveChoice(-1);
    this.onDown = () => this.moveChoice(1);
    enter.on('down', this.onEnter);
    up.on('down', this.onUp);
    down.on('down', this.onDown);

    this.renderPage();
  }

  private renderPage(): void {
    setUiText(this.pageText, this.cfg.pages[this.page] ?? '');
    const isLast = this.page >= this.cfg.pages.length - 1;
    if (isLast && this.cfg.choices?.length) {
      this.renderChoices();
    } else if (!this.cfg.choices?.length || !isLast) {
      // подсказка «дальше»
    }
  }

  private renderChoices(): void {
    this.clearChoices();
    this.cfg.choices!.forEach((c, i) => {
      const t = uiText(
        this.scene,
        GAME_WIDTH - 110,
        GAME_HEIGHT - 52 + 11 + i * 11,
        c.label,
        i === this.choiceIdx ? UI.gold : UI.fog,
      ).setScrollFactor(0);
      this.container!.add(t);
      this.choiceTexts.push(t);
    });
    this.refreshChoices();
  }

  private refreshChoices(): void {
    this.choiceTexts.forEach((t, i) => {
      t.setTint(i === this.choiceIdx ? 0xc9a227 : 0x6f6c8a);
      setUiText(t, `${i === this.choiceIdx ? '> ' : '  '}${this.cfg.choices![i].label}`);
    });
  }

  private clearChoices(): void {
    this.choiceTexts.forEach((t) => t.destroy());
    this.choiceTexts = [];
  }

  private moveChoice(dir: number): void {
    if (!this.choiceTexts.length) return;
    this.choiceIdx = Phaser.Math.Wrap(this.choiceIdx + dir, 0, this.cfg.choices!.length);
    this.refreshChoices();
  }

  private advance(): void {
    const isLast = this.page >= this.cfg.pages.length - 1;
    if (!isLast) {
      this.page += 1;
      this.renderPage();
      return;
    }
    if (this.cfg.choices?.length) {
      if (!this.choiceTexts.length) {
        this.renderChoices();
        return;
      }
      const choice = this.cfg.choices[this.choiceIdx];
      this.close();
      choice.cb();
      return;
    }
    this.close();
  }

  close(): void {
    if (!this.container) return;
    const [enter, up, down] = this.keys;
    if (enter && this.onEnter) enter.off('down', this.onEnter);
    if (up && this.onUp) up.off('down', this.onUp);
    if (down && this.onDown) down.off('down', this.onDown);
    this.keys = [];
    this.onEnter = this.onUp = this.onDown = null;
    this.clearChoices();
    this.container?.destroy(true);
    this.container = null;
    // задержка, чтобы Enter закрытия не провалился в геймплей
    this.scene.time.delayedCall(120, () => this.scene.registry.set('dialogOpen', false));
  }
}
