import Phaser from 'phaser';
import { CLASSES, CAT_FRAMES, FRAMES_PER_CLASS, ENEMY_FRAMES, UI_FRAMES, BOSS_FRAMES } from '../config/gameData';
import { registerFont } from '../ui/text';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    this.load.spritesheet('cats', 'assets/cats.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('tiles', 'assets/tiles.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('enemies', 'assets/enemies.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('ui', 'assets/ui.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('boss', 'assets/boss.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('font', 'assets/font.png');
    this.load.image('vignette', 'assets/vignette.png');
    this.load.image('fog', 'assets/fog.png');
    this.load.image('glow', 'assets/glow.png');
    this.load.image('particle', 'assets/particle.png');
  }

  create(): void {
    registerFont(this);

    // Анимации: ключ `${class}-${anim}`, кадры со сдвигом ряда класса
    CLASSES.forEach((def, classIndex) => {
      const off = classIndex * FRAMES_PER_CLASS;
      const frames = (list: readonly number[]) =>
        list.map((f) => ({ key: 'cats', frame: off + f }));

      this.anims.create({ key: `${def.key}-idle`, frames: frames(CAT_FRAMES.idle), frameRate: 2, repeat: -1 });
      this.anims.create({ key: `${def.key}-walk`, frames: frames(CAT_FRAMES.walkSide), frameRate: 11, repeat: -1 });
      this.anims.create({ key: `${def.key}-walk-down`, frames: frames(CAT_FRAMES.walkDown), frameRate: 8, repeat: -1 });
      this.anims.create({ key: `${def.key}-walk-up`, frames: frames(CAT_FRAMES.walkUp), frameRate: 8, repeat: -1 });
      this.anims.create({ key: `${def.key}-attack`, frames: frames(CAT_FRAMES.attack), frameRate: 16, repeat: 0 });
      this.anims.create({ key: `${def.key}-roll`, frames: frames(CAT_FRAMES.roll), frameRate: 14, repeat: -1 });
      this.anims.create({ key: `${def.key}-death`, frames: frames(CAT_FRAMES.death), frameRate: 4, repeat: 0 });
    });

    // анимации врагов
    const eFrames = (list: readonly number[]) => list.map((f) => ({ key: 'enemies', frame: f }));
    for (const key of ['gravehound', 'acolyte'] as const) {
      const fr = ENEMY_FRAMES[key];
      this.anims.create({ key: `${key}-idle`, frames: eFrames(fr.idle), frameRate: 2, repeat: -1 });
      this.anims.create({ key: `${key}-walk`, frames: eFrames(fr.walk), frameRate: 6, repeat: -1 });
      this.anims.create({ key: `${key}-windup`, frames: eFrames(fr.windup), frameRate: 6, repeat: -1 });
      this.anims.create({ key: `${key}-attack`, frames: eFrames(fr.attack), frameRate: 10, repeat: 0 });
      this.anims.create({ key: `${key}-death`, frames: eFrames(fr.death), frameRate: 4, repeat: 0 });
    }
    this.anims.create({ key: 'fish', frames: eFrames(ENEMY_FRAMES.fish), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'bolt', frames: eFrames(ENEMY_FRAMES.bolt), frameRate: 8, repeat: -1 });

    const uiFrames = (list: readonly number[]) => list.map((f) => ({ key: 'ui', frame: f }));
    this.anims.create({ key: 'shrine-flame', frames: uiFrames(UI_FRAMES.flame), frameRate: 5, repeat: -1 });
    this.anims.create({ key: 'fishbone', frames: uiFrames(UI_FRAMES.fishbone), frameRate: 3, repeat: -1 });

    const bFrames = (list: readonly number[]) => list.map((f) => ({ key: 'boss', frame: f }));
    this.anims.create({ key: 'warden-idle', frames: bFrames(BOSS_FRAMES.idle), frameRate: 2, repeat: -1 });
    this.anims.create({ key: 'warden-walk', frames: bFrames(BOSS_FRAMES.walk), frameRate: 4, repeat: -1 });
    this.anims.create({ key: 'warden-swipe-windup', frames: bFrames(BOSS_FRAMES.swipeWindup), frameRate: 5, repeat: -1 });
    this.anims.create({ key: 'warden-swipe', frames: bFrames(BOSS_FRAMES.swipe), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'warden-slam-windup', frames: bFrames(BOSS_FRAMES.slamWindup), frameRate: 5, repeat: -1 });
    this.anims.create({ key: 'warden-slam', frames: bFrames(BOSS_FRAMES.slam), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'warden-death', frames: bFrames(BOSS_FRAMES.death), frameRate: 3, repeat: 0 });

    if (!this.registry.has('classKey')) this.registry.set('classKey', 'knight');
    if (!this.registry.has('souls')) this.registry.set('souls', 0);
    this.scene.start('title');
  }
}
