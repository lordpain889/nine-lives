import Phaser from 'phaser';
import { CLASSES, CAT_FRAMES, FRAMES_PER_CLASS } from '../config/gameData';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    this.load.spritesheet('cats', 'assets/cats.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('tiles', 'assets/tiles.png', { frameWidth: 16, frameHeight: 16 });
  }

  create(): void {
    // Анимации: ключ `${class}-${anim}`, кадры со сдвигом ряда класса
    CLASSES.forEach((def, classIndex) => {
      const off = classIndex * FRAMES_PER_CLASS;
      const frames = (list: readonly number[]) =>
        list.map((f) => ({ key: 'cats', frame: off + f }));

      this.anims.create({ key: `${def.key}-idle`, frames: frames(CAT_FRAMES.idle), frameRate: 2, repeat: -1 });
      this.anims.create({ key: `${def.key}-walk`, frames: frames(CAT_FRAMES.walkSide), frameRate: 8, repeat: -1 });
      this.anims.create({ key: `${def.key}-walk-down`, frames: frames(CAT_FRAMES.walkDown), frameRate: 6, repeat: -1 });
      this.anims.create({ key: `${def.key}-walk-up`, frames: frames(CAT_FRAMES.walkUp), frameRate: 6, repeat: -1 });
      this.anims.create({ key: `${def.key}-attack`, frames: frames(CAT_FRAMES.attack), frameRate: 14, repeat: 0 });
      this.anims.create({ key: `${def.key}-roll`, frames: frames(CAT_FRAMES.roll), frameRate: 14, repeat: -1 });
      this.anims.create({ key: `${def.key}-death`, frames: frames(CAT_FRAMES.death), frameRate: 4, repeat: 0 });
    });

    if (!this.registry.has('classKey')) this.registry.set('classKey', 'knight');
    this.scene.start('game');
  }
}
