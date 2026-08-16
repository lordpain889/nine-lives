import Phaser from 'phaser';
import type { EnemyDef } from '../types';
import { Damageable, knockbackFrom, hitFlash } from '../systems/combat';
import type { Player } from './Player';

type State = 'patrol' | 'aggro' | 'windup' | 'attack' | 'recover' | 'dead';

export class Enemy extends Phaser.Physics.Arcade.Sprite implements Damageable {
  readonly def: EnemyDef;
  hp: number;
  enemyState: State = 'patrol';

  private homeX: number;
  private patrolDir = 1;
  private stateUntil = 0;
  // куда бил в момент замаха — атака идёт туда, её можно уклониться
  private targetX = 0;
  private targetY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, def: EnemyDef) {
    super(scene, x, y, 'enemies');
    this.def = def;
    this.hp = def.hp;
    this.homeX = x;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(12, 10);
    body.setOffset(2, 5);

    this.play(`${def.key}-idle`);
  }

  update(player: Player): void {
    if (this.enemyState === 'dead') return;
    const now = this.scene.time.now;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const playerAlive = player.state !== 'dead';

    switch (this.enemyState) {
      case 'patrol': {
        // туда-сюда вокруг точки спавна
        if (Math.abs(this.x - (this.homeX + this.patrolDir * 20)) < 3) this.patrolDir *= -1;
        this.setVelocity(this.patrolDir * this.def.speed * 0.4, 0);
        this.setFlipX(this.patrolDir < 0);
        this.play(`${this.def.key}-walk`, true);
        if (playerAlive && dist < this.def.aggroRadius) this.enemyState = 'aggro';
        break;
      }
      case 'aggro': {
        if (!playerAlive || dist > this.def.aggroRadius * 1.8) {
          this.enemyState = 'patrol';
          break;
        }
        if (dist < this.def.attackRange) {
          // замах: стоим, телеграфим
          this.enemyState = 'windup';
          this.stateUntil = now + this.def.windupMs;
          this.targetX = player.x;
          this.targetY = player.y;
          this.setVelocity(0, 0);
          this.play(`${this.def.key}-windup`, true);
          hitFlash(this.scene, this, 70);
          this.scene.time.delayedCall(this.def.windupMs / 2, () => {
            if (this.enemyState === 'windup') hitFlash(this.scene, this, 70);
          });
        } else {
          this.scene.physics.moveToObject(this, player, this.def.speed);
          const body = this.body as Phaser.Physics.Arcade.Body;
          this.setFlipX(body.velocity.x < 0);
          this.play(`${this.def.key}-walk`, true);
        }
        break;
      }
      case 'windup': {
        if (now >= this.stateUntil) {
          this.enemyState = 'attack';
          this.play(`${this.def.key}-attack`, true);
          if (this.def.kind === 'melee') {
            this.scene.events.emit('enemy-melee', {
              x: this.targetX,
              y: this.targetY,
              damage: this.def.damage,
              fromX: this.x,
              fromY: this.y,
            });
            // рывок к цели замаха
            const dir = new Phaser.Math.Vector2(this.targetX - this.x, this.targetY - this.y);
            if (dir.lengthSq() > 0) {
              dir.normalize().scale(this.def.speed * 2.2);
              this.setVelocity(dir.x, dir.y);
            }
          } else {
            this.scene.events.emit('enemy-cast', {
              x: this.x,
              y: this.y - 8,
              targetX: this.targetX,
              targetY: this.targetY,
              damage: this.def.damage,
            });
          }
          this.stateUntil = now + 250;
        }
        break;
      }
      case 'attack': {
        if (now >= this.stateUntil) {
          this.enemyState = 'recover';
          this.stateUntil = now + this.def.recoverMs;
          this.setVelocity(0, 0);
          this.play(`${this.def.key}-idle`, true);
        }
        break;
      }
      case 'recover': {
        if (now >= this.stateUntil) this.enemyState = 'aggro';
        break;
      }
    }

    this.setDepth(this.y);
  }

  takeHit(damage: number, fromX: number, fromY: number): void {
    if (this.enemyState === 'dead') return;
    this.hp -= damage;
    this.scene.events.emit('float-text', { x: this.x, y: this.y - 10, text: String(damage), tint: 0xc9a227 });
    hitFlash(this.scene, this);
    knockbackFrom(this, fromX, fromY, 90);
    // удар выводит из патруля
    if (this.enemyState === 'patrol') this.enemyState = 'aggro';

    if (this.hp <= 0) this.die();
  }

  private die(): void {
    this.enemyState = 'dead';
    this.setVelocity(0, 0);
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
    this.play(`${this.def.key}-death`);
    this.scene.events.emit('enemy-died', { soulValue: this.def.soulValue, x: this.x, y: this.y });
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      delay: 1200,
      duration: 600,
      onComplete: () => this.destroy(),
    });
  }
}
