import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { hitFlash } from '../systems/combat';
import type { EnemyDef } from '../types';
import type { Player } from './Player';

// Дух: не ходит сквозь стены — телепортируется. Полупрозрачный,
// перед атакой мигает и возникает на кольце вокруг игрока.

interface WalkableScene {
  isWalkable(px: number, py: number): boolean;
}

export class SpiritEnemy extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number, def: EnemyDef) {
    super(scene, x, y, def);
    this.setAlpha(0.75);
  }

  private teleportNear(player: Player): void {
    const scene = this.scene as unknown as WalkableScene;
    const radius = 55;
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i + Math.random() * 0.5;
      const tx = player.x + Math.cos(angle) * radius;
      const ty = player.y + Math.sin(angle) * radius;
      if (scene.isWalkable(tx, ty)) {
        // растворение → появление
        this.scene.tweens.add({
          targets: this,
          alpha: 0,
          duration: 140,
          onComplete: () => {
            this.setPosition(tx, ty);
            this.scene.tweens.add({ targets: this, alpha: 0.75, duration: 140 });
          },
        });
        return;
      }
    }
  }

  update(player: Player): void {
    if (this.enemyState === 'dead') return;
    const now = this.scene.time.now;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const playerAlive = player.state !== 'dead';

    switch (this.enemyState) {
      case 'patrol': {
        // парит на месте
        this.setVelocity(0, Math.sin(now / 400) * 6);
        this.play(`${this.def.key}-idle`, true);
        if (playerAlive && dist < this.def.aggroRadius) this.enemyState = 'aggro';
        break;
      }
      case 'aggro': {
        if (!playerAlive || dist > this.def.aggroRadius * 1.8) {
          this.enemyState = 'patrol';
          break;
        }
        if (dist < this.def.attackRange) {
          this.teleportNear(player);
          this.enemyState = 'windup';
          this.stateUntil = now + this.def.windupMs + 300; // время на телепорт
          this.targetX = player.x;
          this.targetY = player.y;
          this.setVelocity(0, 0);
          this.play(`${this.def.key}-windup`, true);
          hitFlash(this.scene, this, 70);
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
          this.scene.events.emit('enemy-cast', {
            x: this.x,
            y: this.y - 4,
            targetX: player.x, // дух ведёт прицел до последнего
            targetY: player.y,
            damage: this.def.damage,
          });
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
}
