import Phaser from 'phaser';
import type { ClassDef } from '../types';
import { TUNING } from '../config/gameData';
import { Damageable, knockbackFrom, hitFlash } from '../systems/combat';

type Facing = 'left' | 'right' | 'up' | 'down';
type State = 'move' | 'attack' | 'roll' | 'dead';

const FACING_VEC: Record<Facing, [number, number]> = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
  down: [0, 1],
};

export class Player extends Phaser.Physics.Arcade.Sprite implements Damageable {
  readonly classDef: ClassDef;
  facing: Facing = 'down';
  state: State = 'move';

  hp: number;
  stamina: number;
  private iframesUntil = 0;
  private staminaLockedUntil = 0;
  private nextAttackAt = 0;

  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor(scene: Phaser.Scene, x: number, y: number, classDef: ClassDef) {
    super(scene, x, y, 'cats');
    this.classDef = classDef;
    this.hp = classDef.hp;
    this.stamina = classDef.stamina;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // хитбокс — «лапы» (нижняя часть), чтобы верх спрайта заходил за препятствия
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 8);
    body.setOffset(3, 8);

    const kb = scene.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      up: kb.addKey(K.UP),
      down: kb.addKey(K.DOWN),
      left: kb.addKey(K.LEFT),
      right: kb.addKey(K.RIGHT),
      w: kb.addKey(K.W),
      s: kb.addKey(K.S),
      a: kb.addKey(K.A),
      d: kb.addKey(K.D),
      attack1: kb.addKey(K.J),
      attack2: kb.addKey(K.Z),
      attack3: kb.addKey(K.SPACE),
      roll1: kb.addKey(K.K),
      roll2: kb.addKey(K.X),
      roll3: kb.addKey(K.SHIFT),
    };

    this.play(`${classDef.key}-idle`);
    this.syncHud();
  }

  get isInvulnerable(): boolean {
    return this.scene.time.now < this.iframesUntil;
  }

  private spendStamina(cost: number): void {
    this.stamina = Math.max(0, this.stamina - cost);
    this.staminaLockedUntil = this.scene.time.now + TUNING.staminaRegenDelayMs;
    this.syncHud();
  }

  private syncHud(): void {
    this.scene.registry.set('hp', this.hp);
    this.scene.registry.set('maxHp', this.classDef.hp);
    this.scene.registry.set('stamina', this.stamina);
    this.scene.registry.set('maxStamina', this.classDef.stamina);
  }

  update(time: number, delta: number): void {
    if (this.state === 'dead') return;

    // реген стамины
    if (time > this.staminaLockedUntil && this.stamina < this.classDef.stamina) {
      this.stamina = Math.min(
        this.classDef.stamina,
        this.stamina + (TUNING.staminaRegenPerSec * delta) / 1000,
      );
      this.syncHud();
    }

    if (this.state === 'attack' || this.state === 'roll') {
      this.setDepth(this.y);
      return; // управление заблокировано, скорость выставлена при старте действия
    }

    const k = this.keys;
    let vx = 0;
    let vy = 0;
    if (k.left.isDown || k.a.isDown) vx -= 1;
    if (k.right.isDown || k.d.isDown) vx += 1;
    if (k.up.isDown || k.w.isDown) vy -= 1;
    if (k.down.isDown || k.s.isDown) vy += 1;

    const v = new Phaser.Math.Vector2(vx, vy).normalize().scale(this.classDef.speed);
    this.setVelocity(v.x, v.y);

    if (vx !== 0 || vy !== 0) {
      if (vx < 0) this.facing = 'left';
      else if (vx > 0) this.facing = 'right';
      else if (vy < 0) this.facing = 'up';
      else this.facing = 'down';

      const key = this.classDef.key;
      if (this.facing === 'up') this.play(`${key}-walk-up`, true);
      else if (this.facing === 'down') this.play(`${key}-walk-down`, true);
      else this.play(`${key}-walk`, true);
    } else {
      this.play(`${this.classDef.key}-idle`, true);
    }
    this.setFlipX(this.facing === 'left');

    if (
      (Phaser.Input.Keyboard.JustDown(k.attack1) ||
        Phaser.Input.Keyboard.JustDown(k.attack2) ||
        Phaser.Input.Keyboard.JustDown(k.attack3)) &&
      time > this.nextAttackAt
    ) {
      this.tryAttack();
    } else if (
      Phaser.Input.Keyboard.JustDown(k.roll1) ||
      Phaser.Input.Keyboard.JustDown(k.roll2) ||
      Phaser.Input.Keyboard.JustDown(k.roll3)
    ) {
      this.tryRoll(vx, vy);
    }

    this.setDepth(this.y);
  }

  private tryAttack(): void {
    const atk = this.classDef.attack;
    if (this.stamina < atk.staminaCost) return;
    this.spendStamina(atk.staminaCost);
    this.nextAttackAt = this.scene.time.now + atk.cooldownMs;
    this.state = 'attack';
    this.setVelocity(0, 0);
    this.play(`${this.classDef.key}-attack`);

    const [dx, dy] = FACING_VEC[this.facing];
    // удар/каст на активном кадре анимации (~70 мс от старта)
    this.scene.time.delayedCall(70, () => {
      if (this.state !== 'attack') return;
      if (atk.kind === 'melee') {
        this.scene.events.emit('player-melee', {
          x: this.x + dx * atk.range,
          y: this.y + dy * atk.range,
          damage: atk.damage,
        });
      } else {
        this.scene.events.emit('player-cast', {
          x: this.x + dx * 10,
          y: this.y + dy * 10,
          dirX: dx,
          dirY: dy,
          damage: atk.damage,
        });
      }
    });

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.state === 'attack') this.state = 'move';
    });
  }

  private tryRoll(vx: number, vy: number): void {
    const roll = this.classDef.roll;
    if (this.stamina < roll.staminaCost) return;
    this.spendStamina(roll.staminaCost);
    this.state = 'roll';
    this.iframesUntil = this.scene.time.now + roll.iframesMs;

    const dir =
      vx !== 0 || vy !== 0
        ? new Phaser.Math.Vector2(vx, vy).normalize()
        : new Phaser.Math.Vector2(...FACING_VEC[this.facing]);
    this.setVelocity(dir.x * roll.speed, dir.y * roll.speed);
    this.play(`${this.classDef.key}-roll`);

    this.scene.time.delayedCall(roll.durationMs, () => {
      if (this.state === 'roll') {
        this.state = 'move';
        this.setVelocity(0, 0);
      }
    });
  }

  takeHit(damage: number, fromX: number, fromY: number): void {
    if (this.state === 'dead' || this.isInvulnerable) return;
    this.hp = Math.max(0, this.hp - damage);
    this.iframesUntil = this.scene.time.now + TUNING.playerIframesAfterHitMs;
    this.syncHud();
    hitFlash(this.scene, this);
    knockbackFrom(this, fromX, fromY, TUNING.knockback);
    this.scene.cameras.main.shake(80, 0.008);

    if (this.hp <= 0) {
      this.die();
    } else {
      // сбить текущее действие
      if (this.state === 'attack' || this.state === 'roll') this.state = 'move';
    }
  }

  private die(): void {
    this.state = 'dead';
    this.setVelocity(0, 0);
    this.play(`${this.classDef.key}-death`);
    this.scene.events.emit('player-died');
  }

  // Воскрешение у чекпоинта (M4)
  revive(x: number, y: number): void {
    this.setPosition(x, y);
    this.hp = this.classDef.hp;
    this.stamina = this.classDef.stamina;
    this.state = 'move';
    this.iframesUntil = this.scene.time.now + 800;
    this.clearTint();
    this.play(`${this.classDef.key}-idle`);
    this.syncHud();
  }
}
