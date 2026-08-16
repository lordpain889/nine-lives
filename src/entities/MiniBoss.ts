import Phaser from 'phaser';
import { BOSS } from '../config/gameData';
import { Damageable, hitFlash } from '../systems/combat';
import type { Player } from './Player';

type State = 'dormant' | 'aggro' | 'windup' | 'attack' | 'recover' | 'dead';
type AttackKind = 'swipe' | 'slam';

export class MiniBoss extends Phaser.Physics.Arcade.Sprite implements Damageable {
  hp = BOSS.hp;
  bossState: State = 'dormant';

  private stateUntil = 0;
  private pendingAttack: AttackKind = 'swipe';
  private targetX = 0;
  private targetY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'boss');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 20);
    body.setOffset(4, 10);
    body.pushable = false;
    this.play('warden-idle');
  }

  get phase2(): boolean {
    return this.hp <= BOSS.hp * BOSS.phase2At;
  }

  private windupMs(kind: AttackKind): number {
    const base = kind === 'swipe' ? BOSS.swipe.windupMs : BOSS.slam.windupMs;
    return this.phase2 ? base * BOSS.phase2Speedup : base;
  }

  activate(): void {
    if (this.bossState === 'dormant') {
      this.bossState = 'aggro';
      this.scene.registry.set('bossActive', true);
      this.scene.registry.set('bossName', BOSS.nameRu);
      this.scene.registry.set('bossHp', this.hp);
      this.scene.registry.set('bossMaxHp', BOSS.hp);
      (this.scene as Phaser.Scene & { bossIntro?: (n: string) => void }).bossIntro?.(BOSS.nameRu);
    }
  }

  update(player: Player): void {
    if (this.bossState === 'dormant' || this.bossState === 'dead') return;
    const now = this.scene.time.now;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (player.state === 'dead') {
      this.setVelocity(0, 0);
      this.play('warden-idle', true);
      return;
    }

    switch (this.bossState) {
      case 'aggro': {
        if (dist < BOSS.swipe.range) {
          this.beginWindup('swipe', player);
        } else if (dist < BOSS.slam.range && this.phase2) {
          // в фазе 2 достаёт слэмом издалека
          this.beginWindup('slam', player);
        } else if (dist < BOSS.slam.range * 0.6) {
          this.beginWindup('slam', player);
        } else {
          this.scene.physics.moveToObject(this, player, BOSS.speed * (this.phase2 ? 1.3 : 1));
          const body = this.body as Phaser.Physics.Arcade.Body;
          this.setFlipX(body.velocity.x < 0);
          this.play('warden-walk', true);
        }
        break;
      }
      case 'windup': {
        if (now >= this.stateUntil) {
          this.bossState = 'attack';
          this.stateUntil = now + 300;
          if (this.pendingAttack === 'swipe') {
            this.play('warden-swipe', true);
            this.scene.events.emit('boss-swipe', {
              x: this.targetX,
              y: this.targetY,
              damage: BOSS.swipe.damage,
              fromX: this.x,
              fromY: this.y,
              size: BOSS.swipe.hitbox,
            });
          } else {
            this.play('warden-slam', true);
            this.scene.events.emit('boss-slam', {
              x: this.x,
              y: this.y + 6,
              damage: BOSS.slam.damage,
              radius: BOSS.slam.radius,
            });
          }
        }
        break;
      }
      case 'attack': {
        if (now >= this.stateUntil) {
          this.bossState = 'recover';
          this.stateUntil = now + (this.phase2 ? BOSS.recoverMs * 0.7 : BOSS.recoverMs);
          this.play('warden-idle', true);
        }
        break;
      }
      case 'recover': {
        if (now >= this.stateUntil) this.bossState = 'aggro';
        break;
      }
    }

    this.setDepth(this.y);
  }

  private beginWindup(kind: AttackKind, player: Player): void {
    this.bossState = 'windup';
    this.pendingAttack = kind;
    this.stateUntil = this.scene.time.now + this.windupMs(kind);
    this.targetX = player.x;
    this.targetY = player.y;
    this.setVelocity(0, 0);
    this.play(kind === 'swipe' ? 'warden-swipe-windup' : 'warden-slam-windup', true);
    hitFlash(this.scene, this, 80);
    this.scene.time.delayedCall(this.windupMs(kind) / 2, () => {
      if (this.bossState === 'windup') hitFlash(this.scene, this, 80);
    });
  }

  takeHit(damage: number, _fromX: number, _fromY: number): void {
    if (this.bossState === 'dead' || this.bossState === 'dormant') return;
    this.hp -= damage;
    this.scene.events.emit('float-text', { x: this.x, y: this.y - 18, text: String(damage), tint: 0xc9a227 });
    this.scene.registry.set('bossHp', Math.max(0, this.hp));
    hitFlash(this.scene, this);
    // босс не отлетает от ударов
    if (this.hp <= 0) this.die();
  }

  private die(): void {
    this.bossState = 'dead';
    this.setVelocity(0, 0);
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
    this.play('warden-death');
    this.scene.registry.set('bossActive', false);
    this.scene.events.emit('enemy-died', { key: 'warden', soulValue: BOSS.soulValue, x: this.x, y: this.y });
    this.scene.events.emit('boss-defeated', { boss: 'warden' });
  }
}
