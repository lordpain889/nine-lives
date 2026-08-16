import Phaser from 'phaser';
import type { ClassDef, EquipSlot, SaveGame } from '../types';
import { TUNING } from '../config/gameData';
import { itemById } from '../config/items';
import { Damageable, knockbackFrom, hitFlash } from '../systems/combat';

type Facing = 'left' | 'right' | 'up' | 'down';
type State = 'move' | 'attack' | 'roll' | 'dead';

const FACING_VEC: Record<Facing, [number, number]> = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
  down: [0, 1],
};

// Производные статы: база класса + модификаторы экипировки
export interface DerivedStats {
  maxHp: number;
  maxStamina: number;
  speed: number;
  damage: number;
  staminaCostMul: number;
  cooldownMul: number;
}

export class Player extends Phaser.Physics.Arcade.Sprite implements Damageable {
  readonly classDef: ClassDef;
  facing: Facing = 'down';
  state: State = 'move';
  stats!: DerivedStats;

  hp: number;
  stamina: number;
  private iframesUntil = 0;
  private staminaLockedUntil = 0;
  private nextAttackAt = 0;

  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor(scene: Phaser.Scene, x: number, y: number, classDef: ClassDef) {
    super(scene, x, y, 'cats');
    this.classDef = classDef;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.recomputeStats();
    this.hp = this.stats.maxHp;
    this.stamina = this.stats.maxStamina;

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
      flask1: kb.addKey(K.H),
      flask2: kb.addKey(K.F),
    };

    this.play(`${classDef.key}-idle`);
    this.syncHud();
  }

  get isInvulnerable(): boolean {
    return this.scene.time.now < this.iframesUntil;
  }

  // База класса + модификаторы экипировки из сейва
  recomputeStats(): void {
    const c = this.classDef;
    const stats: DerivedStats = {
      maxHp: c.hp,
      maxStamina: c.stamina,
      speed: c.speed,
      damage: c.attack.damage,
      staminaCostMul: 1,
      cooldownMul: 1,
    };
    const save = this.scene.registry.get('save') as SaveGame | undefined;
    if (save) {
      for (const slot of ['weapon', 'armor', 'charm'] as EquipSlot[]) {
        const id = save.equipment[slot];
        if (!id) continue;
        const mods = itemById(id).stats;
        if (!mods) continue;
        stats.maxHp += mods.hp ?? 0;
        stats.maxStamina += mods.stamina ?? 0;
        stats.speed += mods.speed ?? 0;
        stats.damage += mods.damage ?? 0;
        stats.staminaCostMul *= mods.staminaCostMul ?? 1;
        stats.cooldownMul *= mods.cooldownMul ?? 1;
      }
    }
    this.stats = stats;
    this.hp = Math.min(this.hp ?? stats.maxHp, stats.maxHp);
    this.stamina = Math.min(this.stamina ?? stats.maxStamina, stats.maxStamina);
    this.syncHud();
  }

  private spendStamina(cost: number): void {
    this.stamina = Math.max(0, this.stamina - cost);
    this.staminaLockedUntil = this.scene.time.now + TUNING.staminaRegenDelayMs;
    this.syncHud();
  }

  private syncHud(): void {
    this.scene.registry.set('hp', this.hp);
    this.scene.registry.set('maxHp', this.stats.maxHp);
    this.scene.registry.set('stamina', this.stamina);
    this.scene.registry.set('maxStamina', this.stats.maxStamina);
  }

  update(time: number, delta: number): void {
    if (this.state === 'dead') return;

    // реген стамины
    if (time > this.staminaLockedUntil && this.stamina < this.stats.maxStamina) {
      this.stamina = Math.min(
        this.stats.maxStamina,
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

    const v = new Phaser.Math.Vector2(vx, vy).normalize().scale(this.stats.speed);
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
    } else if (Phaser.Input.Keyboard.JustDown(k.flask1) || Phaser.Input.Keyboard.JustDown(k.flask2)) {
      this.drinkFlask();
    }

    this.setDepth(this.y);
  }

  private tryAttack(): void {
    const atk = this.classDef.attack;
    const cost = atk.staminaCost * this.stats.staminaCostMul;
    if (this.stamina < cost) return;
    this.spendStamina(cost);
    this.nextAttackAt = this.scene.time.now + atk.cooldownMs * this.stats.cooldownMul;
    this.state = 'attack';
    this.setVelocity(0, 0);
    this.play(`${this.classDef.key}-attack`);

    const [dx, dy] = FACING_VEC[this.facing];
    const damage = this.stats.damage;
    // удар/каст на активном кадре анимации (~70 мс от старта)
    this.scene.time.delayedCall(70, () => {
      if (this.state !== 'attack') return;
      if (atk.kind === 'melee') {
        this.scene.events.emit('player-melee', {
          x: this.x + dx * atk.range,
          y: this.y + dy * atk.range,
          damage,
        });
      } else {
        this.scene.events.emit('player-cast', {
          x: this.x + dx * 10,
          y: this.y + dy * 10,
          dirX: dx,
          dirY: dy,
          damage,
        });
      }
    });

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.state === 'attack') this.state = 'move';
    });
  }

  private tryRoll(vx: number, vy: number): void {
    const roll = this.classDef.roll;
    const cost = roll.staminaCost * this.stats.staminaCostMul;
    if (this.stamina < cost) return;
    this.spendStamina(cost);
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

  private drinkFlask(): void {
    const flasks = (this.scene.registry.get('flasks') as number) ?? 0;
    if (flasks <= 0 || this.hp >= this.stats.maxHp) return;
    this.scene.registry.set('flasks', flasks - 1);
    this.hp = Math.min(this.stats.maxHp, this.hp + TUNING.flaskHeal);
    this.syncHud();
    // зелёная вспышка лечения
    this.setTintFill(0x3e7a4e);
    this.scene.time.delayedCall(120, () => {
      if (this.active) this.clearTint();
    });
  }

  takeHit(damage: number, fromX: number, fromY: number): void {
    if (this.state === 'dead' || this.isInvulnerable) return;
    this.hp = Math.max(0, this.hp - damage);
    this.scene.events.emit('float-text', { x: this.x, y: this.y - 12, text: String(damage), tint: 0x8c2233 });
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

  // Воскрешение у чекпоинта
  revive(x: number, y: number): void {
    this.setPosition(x, y);
    this.hp = this.stats.maxHp;
    this.stamina = this.stats.maxStamina;
    this.state = 'move';
    this.iframesUntil = this.scene.time.now + 800;
    this.clearTint();
    this.play(`${this.classDef.key}-idle`);
    this.syncHud();
  }
}
