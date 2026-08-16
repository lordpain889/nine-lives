import Phaser from 'phaser';
import type { ClassDef } from '../types';

type Facing = 'left' | 'right' | 'up' | 'down';

export class Player extends Phaser.Physics.Arcade.Sprite {
  readonly classDef: ClassDef;
  facing: Facing = 'down';

  private keys: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
  };

  constructor(scene: Phaser.Scene, x: number, y: number, classDef: ClassDef) {
    super(scene, x, y, 'cats');
    this.classDef = classDef;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // хитбокс — «лапы» (нижняя часть), чтобы верх спрайта заходил за препятствия
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 8);
    body.setOffset(3, 8);

    const kb = scene.input.keyboard!;
    this.keys = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      s: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.play(`${classDef.key}-idle`);
  }

  update(): void {
    const k = this.keys;
    let vx = 0;
    let vy = 0;
    if (k.left.isDown || k.a.isDown) vx -= 1;
    if (k.right.isDown || k.d.isDown) vx += 1;
    if (k.up.isDown || k.w.isDown) vy -= 1;
    if (k.down.isDown || k.s.isDown) vy += 1;

    const speed = this.classDef.speed;
    const v = new Phaser.Math.Vector2(vx, vy).normalize().scale(speed);
    this.setVelocity(v.x, v.y);

    if (vx !== 0 || vy !== 0) {
      // горизонталь приоритетна для facing (side-кадры выразительнее)
      if (vx < 0) this.facing = 'left';
      else if (vx > 0) this.facing = 'right';
      else if (vy < 0) this.facing = 'up';
      else this.facing = 'down';

      const key = this.classDef.key;
      if (this.facing === 'up') this.play(`${key}-walk-up`, true);
      else if (this.facing === 'down') this.play(`${key}-walk-down`, true);
      else this.play(`${key}-walk`, true);
      this.setFlipX(this.facing === 'left');
    } else {
      this.play(`${this.classDef.key}-idle`, true);
      this.setFlipX(this.facing === 'left');
    }

    // сортировка по глубине: кто ниже — тот ближе
    this.setDepth(this.y);
  }
}
