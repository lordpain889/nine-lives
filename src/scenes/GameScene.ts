import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Shrine } from '../entities/Shrine';
import { classByKey, COLLIDING_TILES, ENEMIES, STRINGS, TUNING } from '../config/gameData';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { buildGraveyard, SPAWNS } from '../levels/graveyard';
import { spawnMeleeHitbox } from '../systems/combat';

const SHRINE_RADIUS = 22;

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private shrines: Shrine[] = [];
  private soulDrop: Phaser.Physics.Arcade.Sprite | null = null;
  private playerHitboxes!: Phaser.Physics.Arcade.Group;
  private enemyHitboxes!: Phaser.Physics.Arcade.Group;
  private playerProjectiles!: Phaser.Physics.Arcade.Group;
  private enemyProjectiles!: Phaser.Physics.Arcade.Group;
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private keyE!: Phaser.Input.Keyboard.Key;
  private dying = false;

  constructor() {
    super('game');
  }

  create(): void {
    const data = buildGraveyard();
    const map = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
    const tileset = map.addTilesetImage('tiles', 'tiles', 16, 16)!;
    this.layer = map.createLayer(0, tileset, 0, 0)!;
    this.layer.setCollision(COLLIDING_TILES);

    // ── новый забег: сброс состояния ──
    const ps = SPAWNS.find((s) => s.type === 'player')!;
    const spawn = { x: ps.x * 16 + 8, y: ps.y * 16 + 8 };
    this.registry.set('souls', 0);
    this.registry.set('flasks', TUNING.flasks);
    this.registry.set('checkpoint', spawn);
    this.registry.set('pendingDrop', null);
    this.registry.set('hint', STRINGS.controls);
    this.dying = false;
    this.soulDrop = null;

    const classDef = classByKey(this.registry.get('classKey') as string);
    this.player = new Player(this, spawn.x, spawn.y, classDef);
    this.physics.add.collider(this.player, this.layer);

    // ── алтари ──
    this.shrines = SPAWNS.filter((s) => s.type === 'shrine').map(
      (s) => new Shrine(this, s.x * 16 + 8, s.y * 16 + 8),
    );
    this.keyE = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // ── группы боёвки ──
    this.enemies = this.add.group();
    this.playerHitboxes = this.physics.add.group();
    this.enemyHitboxes = this.physics.add.group();
    this.playerProjectiles = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group();

    this.physics.add.collider(this.enemies, this.layer);
    this.physics.add.collider(this.player, this.enemies);
    this.spawnEnemies();

    // ── оверлапы урона ──
    // Порядок аргументов колбэка у Phaser не гарантирован при миксе
    // группа/спрайт — определяем стороны по типу, не по позиции.
    const pick = <T extends Phaser.GameObjects.GameObject>(
      a: unknown,
      b: unknown,
      isFirst: (o: unknown) => boolean,
    ): [T, Phaser.GameObjects.GameObject] =>
      isFirst(a)
        ? [a as T, b as Phaser.GameObjects.GameObject]
        : [b as T, a as Phaser.GameObjects.GameObject];

    const isZone = (o: unknown) => o instanceof Phaser.GameObjects.Zone;

    this.physics.add.overlap(this.playerHitboxes, this.enemies, (a, b) => {
      const [zone, enemyObj] = pick<Phaser.GameObjects.Zone>(a, b, isZone);
      (enemyObj as Enemy).takeHit(zone.getData('damage') as number, this.player.x, this.player.y);
      zone.destroy();
    });
    this.physics.add.overlap(this.enemyHitboxes, this.player, (a, b) => {
      const [zone] = pick<Phaser.GameObjects.Zone>(a, b, isZone);
      this.player.takeHit(
        zone.getData('damage') as number,
        zone.getData('fromX') as number,
        zone.getData('fromY') as number,
      );
    });
    this.physics.add.overlap(this.playerProjectiles, this.enemies, (a, b) => {
      const [p, enemyObj] = pick<Phaser.Physics.Arcade.Sprite>(a, b, (o) => !(o instanceof Enemy));
      (enemyObj as Enemy).takeHit(p.getData('damage') as number, p.x, p.y);
      p.destroy();
    });
    this.physics.add.overlap(this.enemyProjectiles, this.player, (a, b) => {
      const [p] = pick<Phaser.Physics.Arcade.Sprite>(a, b, (o) => o !== this.player);
      if (this.player.isInvulnerable || this.player.state === 'dead') return;
      this.player.takeHit(p.getData('damage') as number, p.x, p.y);
      p.destroy();
    });
    this.physics.add.collider(this.playerProjectiles, this.layer, (proj) => proj.destroy());
    this.physics.add.collider(this.enemyProjectiles, this.layer, (proj) => proj.destroy());

    // ── события боёвки ──
    this.events.on('player-melee', (e: { x: number; y: number; damage: number }) => {
      spawnMeleeHitbox(this, this.playerHitboxes, e.x, e.y, 16, 16, e.damage);
    });
    this.events.on(
      'player-cast',
      (e: { x: number; y: number; dirX: number; dirY: number; damage: number }) => {
        this.spawnProjectile(this.playerProjectiles, e.x, e.y, e.dirX * 150, e.dirY * 150, 'fish', e.damage, e.dirX < 0);
      },
    );
    this.events.on(
      'enemy-melee',
      (e: { x: number; y: number; damage: number; fromX: number; fromY: number }) => {
        const zone = spawnMeleeHitbox(this, this.enemyHitboxes, e.x, e.y, 18, 18, e.damage, 150);
        zone.setData('fromX', e.fromX);
        zone.setData('fromY', e.fromY);
      },
    );
    this.events.on(
      'enemy-cast',
      (e: { x: number; y: number; targetX: number; targetY: number; damage: number }) => {
        const dir = new Phaser.Math.Vector2(e.targetX - e.x, e.targetY - e.y).normalize();
        this.spawnProjectile(this.enemyProjectiles, e.x, e.y, dir.x * 95, dir.y * 95, 'bolt', e.damage, false);
      },
    );
    this.events.on('enemy-died', (e: { soulValue: number }) => {
      this.registry.set('souls', ((this.registry.get('souls') as number) ?? 0) + e.soulValue);
    });
    this.events.on('player-died', () => this.onPlayerDied());

    // scene.restart() НЕ снимает слушателей — без этого они копятся
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const ev of ['player-melee', 'player-cast', 'enemy-melee', 'enemy-cast', 'enemy-died', 'player-died']) {
        this.events.off(ev);
      }
    });

    // ── камера и HUD ──
    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    cam.startFollow(this.player, true, 0.12, 0.12);
    this.scene.launch('hud');
  }

  // ── враги: спавн и респавн (правило алтаря) ──
  private spawnEnemies(): void {
    this.enemies.clear(true, true);
    for (const s of SPAWNS) {
      if (s.type === 'gravehound' || s.type === 'acolyte') {
        const enemy = new Enemy(this, s.x * 16 + 8, s.y * 16 + 8, ENEMIES[s.type]);
        this.enemies.add(enemy);
      }
    }
  }

  private spawnProjectile(
    group: Phaser.Physics.Arcade.Group,
    x: number,
    y: number,
    vx: number,
    vy: number,
    animKey: 'fish' | 'bolt',
    damage: number,
    flipX: boolean,
  ): void {
    const proj = this.physics.add.sprite(x, y, 'enemies');
    group.add(proj);
    proj.setData('damage', damage);
    proj.play(animKey);
    proj.setFlipX(flipX);
    (proj.body as Phaser.Physics.Arcade.Body).setSize(8, 8);
    proj.setVelocity(vx, vy);
    proj.setDepth(proj.y + 8);
    this.time.delayedCall(1600, () => {
      if (proj.active) proj.destroy();
    });
  }

  // ── алтарь ──
  private restAtShrine(): void {
    this.registry.set('flasks', TUNING.flasks);
    this.registry.set('checkpoint', { x: this.player.x, y: this.player.y });
    this.player.revive(this.player.x, this.player.y);
    this.spawnEnemies(); // отдых воскрешает мир
    this.cameras.main.flash(400, 201, 162, 39, false);
    this.showBanner(STRINGS.rested, '#c9a227');
  }

  // ── смерть и возрождение ──
  private onPlayerDied(): void {
    if (this.dying) return;
    this.dying = true;

    const souls = (this.registry.get('souls') as number) ?? 0;
    this.registry.set('pendingDrop', souls > 0 ? { x: this.player.x, y: this.player.y, amount: souls } : null);
    this.registry.set('souls', 0);

    const text = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, STRINGS.youDied, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#8c2233',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10000)
      .setAlpha(0);
    this.tweens.add({ targets: text, alpha: 1, duration: 900 });

    this.time.delayedCall(2200, () => {
      this.cameras.main.fadeOut(400, 13, 10, 20);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        text.destroy();
        const cp = this.registry.get('checkpoint') as { x: number; y: number };
        this.player.revive(cp.x, cp.y);
        this.registry.set('flasks', TUNING.flasks);
        this.spawnEnemies();
        this.refreshSoulDrop();
        this.dying = false;
        this.cameras.main.fadeIn(400, 13, 10, 20);
      });
    });
  }

  private refreshSoulDrop(): void {
    if (this.soulDrop) {
      this.soulDrop.destroy();
      this.soulDrop = null;
    }
    const drop = this.registry.get('pendingDrop') as { x: number; y: number; amount: number } | null;
    if (!drop) return;

    const sprite = this.physics.add.sprite(drop.x, drop.y, 'ui');
    sprite.play('fishbone');
    sprite.setDepth(drop.y);
    (sprite.body as Phaser.Physics.Arcade.Body).setSize(14, 14);
    this.soulDrop = sprite;
    this.physics.add.overlap(sprite, this.player, () => {
      this.registry.set('souls', ((this.registry.get('souls') as number) ?? 0) + drop.amount);
      this.registry.set('pendingDrop', null);
      sprite.destroy();
      this.soulDrop = null;
      this.showBanner(`${STRINGS.soulsRecovered}: ${drop.amount}`, '#4fa4b8');
    });
  }

  private showBanner(msg: string, color: string): void {
    const banner = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 30, msg, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10000);
    this.tweens.add({ targets: banner, alpha: 0, delay: 1600, duration: 500, onComplete: () => banner.destroy() });
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);
    for (const obj of this.enemies.getChildren()) {
      (obj as Enemy).update(this.player);
    }

    // подсказка и отдых у алтаря
    if (this.player.state !== 'dead') {
      const near = this.shrines.some(
        (s) => Phaser.Math.Distance.Between(s.x, s.y, this.player.x, this.player.y) < SHRINE_RADIUS,
      );
      if (near) {
        this.registry.set('hint', STRINGS.restHint);
        if (Phaser.Input.Keyboard.JustDown(this.keyE)) this.restAtShrine();
      } else if (this.registry.get('hint') === STRINGS.restHint) {
        this.registry.set('hint', '');
      }
    }
  }
}
