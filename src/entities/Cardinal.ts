import Phaser from 'phaser';
import { CARDINAL } from '../config/gameData';
import { Damageable, hitFlash } from '../systems/combat';
import type { Player } from './Player';

type State = 'dormant' | 'idle' | 'windup' | 'recover' | 'dead';
type Action = 'fan' | 'summon' | 'beam';

interface WalkableScene {
  isWalkable(px: number, py: number): boolean;
}

// КАРДИНАЛ ЧУМНОГО СОБОРА: телепорт, веер болтов, призыв крыс;
// фаза 2 (<50% HP) — чумной луч по линии с телеграфом.
export class Cardinal extends Phaser.Physics.Arcade.Sprite implements Damageable {
  hp = CARDINAL.hp;
  bossState: State = 'dormant';

  private stateUntil = 0;
  private nextTeleportAt = 0;
  private pendingAction: Action = 'fan';
  private targetX = 0;
  private targetY = 0;
  private beamLine: Phaser.GameObjects.Graphics | null = null;
  private teleporting = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'boss');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 24);
    body.setOffset(7, 6);
    body.pushable = false;
    body.moves = false; // кардинал не ходит — только телепорт
    this.play('cardinal-idle');
  }

  get phase2(): boolean {
    return this.hp <= CARDINAL.hp * CARDINAL.phase2At;
  }

  activate(): void {
    if (this.bossState !== 'dormant') return;
    this.bossState = 'idle';
    this.stateUntil = this.scene.time.now + 800;
    this.scene.registry.set('bossActive', true);
    this.scene.registry.set('bossName', CARDINAL.nameRu);
    this.scene.registry.set('bossHp', this.hp);
    this.scene.registry.set('bossMaxHp', CARDINAL.hp);
    (this.scene as Phaser.Scene & { bossIntro?: (n: string) => void }).bossIntro?.(CARDINAL.nameRu);
  }

  update(player: Player): void {
    if (this.bossState === 'dormant' || this.bossState === 'dead') return;
    const now = this.scene.time.now;

    if (player.state === 'dead') {
      this.play('cardinal-idle', true);
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    switch (this.bossState) {
      case 'idle': {
        // игрок вплотную или таймер — телепорт в другой угол
        if (dist < 40 || now > this.nextTeleportAt) {
          this.teleport(player);
          this.nextTeleportAt =
            now + (this.phase2 ? CARDINAL.teleportCooldownMs * 0.55 : CARDINAL.teleportCooldownMs);
        }
        if (now >= this.stateUntil) this.chooseAction(player);
        break;
      }
      case 'windup': {
        if (now >= this.stateUntil) this.executeAction(player);
        break;
      }
      case 'recover': {
        if (now >= this.stateUntil) {
          this.bossState = 'idle';
          this.stateUntil = now + CARDINAL.actionGapMs * (this.phase2 ? 0.6 : 1);
          this.play('cardinal-idle', true);
        }
        break;
      }
    }

    this.setDepth(this.y);
  }

  private countMinions(): number {
    const group = (this.scene as unknown as { enemies: Phaser.GameObjects.Group }).enemies;
    if (!group) return 0;
    return group
      .getChildren()
      .filter((o) => (o as { def?: { key: string }; enemyState?: string }).def?.key === 'rat')
      .filter((o) => (o as { enemyState?: string }).enemyState !== 'dead').length;
  }

  private chooseAction(player: Player): void {
    let action: Action = 'fan';
    if (this.countMinions() < 2 && Math.random() < 0.4) action = 'summon';
    else if (this.phase2 && Math.random() < 0.45) action = 'beam';

    this.pendingAction = action;
    this.bossState = 'windup';
    this.targetX = player.x;
    this.targetY = player.y;

    const windup =
      action === 'beam' ? CARDINAL.beam.windupMs : action === 'fan' ? CARDINAL.fan.windupMs : 800;
    this.stateUntil = this.scene.time.now + (this.phase2 ? windup * 0.75 : windup);
    this.play(action === 'summon' ? 'cardinal-summon' : 'cardinal-windup', true);
    hitFlash(this.scene, this, 80);

    // телеграф луча: мерцающая линия к точке прицела
    if (action === 'beam') {
      this.beamLine = this.scene.add.graphics().setDepth(8999);
      const g = this.beamLine;
      g.lineStyle(1, 0x3e7a4e, 0.7);
      g.lineBetween(this.x, this.y, this.targetX, this.targetY);
      this.scene.tweens.add({ targets: g, alpha: 0.25, duration: 160, yoyo: true, repeat: -1 });
    }
  }

  private executeAction(player: Player): void {
    this.bossState = 'recover';
    this.stateUntil = this.scene.time.now + 500;

    if (this.pendingAction === 'fan') {
      this.play('cardinal-cast', true);
      const base = Math.atan2(this.targetY - this.y, this.targetX - this.x);
      const spread = Phaser.Math.DegToRad(CARDINAL.fan.spreadDeg);
      for (let i = 0; i < CARDINAL.fan.count; i++) {
        const angle = base + spread * (i - (CARDINAL.fan.count - 1) / 2);
        this.scene.events.emit('cardinal-bolt', {
          x: this.x + Math.cos(angle) * 14,
          y: this.y + Math.sin(angle) * 14,
          vx: Math.cos(angle) * CARDINAL.fan.speed,
          vy: Math.sin(angle) * CARDINAL.fan.speed,
          damage: CARDINAL.fan.damage,
        });
      }
    } else if (this.pendingAction === 'summon') {
      this.play('cardinal-summon', true);
      const scene = this.scene as unknown as WalkableScene;
      let spawned = 0;
      for (let i = 0; i < 8 && spawned < 2; i++) {
        const angle = (Math.PI / 4) * i;
        const tx = this.x + Math.cos(angle) * 40;
        const ty = this.y + Math.sin(angle) * 40;
        if (scene.isWalkable(tx, ty) && this.countMinions() < CARDINAL.summonCap) {
          this.scene.events.emit('cardinal-summon', { x: tx, y: ty });
          spawned += 1;
        }
      }
    } else {
      // луч: цепочка круговых хитбоксов вдоль линии
      this.play('cardinal-cast', true);
      this.beamLine?.destroy();
      this.beamLine = null;
      const dir = new Phaser.Math.Vector2(this.targetX - this.x, this.targetY - this.y).normalize();
      const beam = this.scene.add.graphics().setDepth(9000);
      beam.lineStyle(3, 0x3e7a4e, 0.95);
      const endX = this.x + dir.x * 300;
      const endY = this.y + dir.y * 300;
      beam.lineBetween(this.x, this.y, endX, endY);
      this.scene.tweens.add({ targets: beam, alpha: 0, duration: 450, onComplete: () => beam.destroy() });
      for (let i = 1; i <= CARDINAL.beam.segments; i++) {
        this.scene.events.emit('cardinal-beam-seg', {
          x: this.x + dir.x * i * 36,
          y: this.y + dir.y * i * 36,
          damage: CARDINAL.beam.damage,
          radius: CARDINAL.beam.radius,
        });
      }
      void player;
    }
  }

  private teleport(player: Player): void {
    if (this.teleporting) return; // иначе вызывается каждый кадр и твины дерутся
    const scene = this.scene as unknown as WalkableScene;
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 90 + Math.random() * 60;
      const tx = player.x + Math.cos(angle) * r;
      const ty = player.y + Math.sin(angle) * r;
      if (scene.isWalkable(tx, ty)) {
        this.teleporting = true;
        this.scene.tweens.add({
          targets: this,
          alpha: 0,
          duration: 160,
          onComplete: () => {
            this.setPosition(tx, ty);
            this.scene.tweens.add({
              targets: this,
              alpha: 1,
              duration: 160,
              onComplete: () => {
                this.teleporting = false;
              },
            });
          },
        });
        return;
      }
    }
  }

  takeHit(damage: number, _fromX: number, _fromY: number): void {
    if (this.bossState === 'dead' || this.bossState === 'dormant') return;
    this.hp -= damage;
    this.scene.registry.set('bossHp', Math.max(0, this.hp));
    this.scene.events.emit('float-text', { x: this.x, y: this.y - 20, text: String(damage), tint: 0xc9a227 });
    hitFlash(this.scene, this);
    if (this.hp <= 0) this.die();
  }

  private die(): void {
    this.bossState = 'dead';
    this.beamLine?.destroy();
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
    this.play('cardinal-death');
    this.scene.registry.set('bossActive', false);
    this.scene.events.emit('enemy-died', {
      key: 'cardinal',
      soulValue: CARDINAL.soulValue,
      x: this.x,
      y: this.y,
    });
    this.scene.events.emit('boss-defeated', { boss: 'cardinal' });
  }
}
