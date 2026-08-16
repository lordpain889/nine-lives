import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { MiniBoss } from '../entities/MiniBoss';
import { Shrine } from '../entities/Shrine';
import { classByKey, COLLIDING_TILES, ENEMIES, STRINGS, TUNING } from '../config/gameData';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { buildGraveyard, buildGraveyardDecor, SPAWNS } from '../levels/graveyard';
import { spawnMeleeHitbox } from '../systems/combat';
import { Atmosphere } from '../systems/atmosphere';
import { rollDrops } from '../systems/loot';
import { newSave, persist, setFlag } from '../systems/save';
import { addItem } from '../config/items';
import { uiText, UI } from '../ui/text';
import type { DropDef, SaveGame } from '../types';

const SHRINE_RADIUS = 22;

export class GameScene extends Phaser.Scene {
  player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private boss: MiniBoss | null = null;
  private shrines: Shrine[] = [];
  private soulDrop: Phaser.Physics.Arcade.Sprite | null = null;
  private playerHitboxes!: Phaser.Physics.Arcade.Group;
  private enemyHitboxes!: Phaser.Physics.Arcade.Group;
  private playerProjectiles!: Phaser.Physics.Arcade.Group;
  private enemyProjectiles!: Phaser.Physics.Arcade.Group;
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private keyE!: Phaser.Input.Keyboard.Key;
  private dying = false;
  private atmosphere!: Atmosphere;
  private save!: SaveGame;
  private shrineIds: string[] = [];

  constructor() {
    super('game');
  }

  create(): void {
    const data = buildGraveyard();
    const map = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
    const tileset = map.addTilesetImage('tiles', 'tiles', 16, 16)!;
    this.layer = map.createLayer(0, tileset, 0, 0)!;
    this.layer.setCollision(COLLIDING_TILES);

    // декор-слой поверх земли (без коллизий)
    const decorMap = this.make.tilemap({
      data: buildGraveyardDecor(data),
      tileWidth: 16,
      tileHeight: 16,
    });
    decorMap.addTilesetImage('tiles', 'tiles', 16, 16);
    decorMap.createLayer(0, 'tiles', 0, 0)!.setDepth(1);

    // ── состояние забега из сейва ──
    if (!this.registry.has('save')) {
      // фолбэк для дев-перезагрузок: свежий сейв по выбранному классу
      this.registry.set('save', newSave((this.registry.get('classKey') as SaveGame['classKey']) ?? 'knight'));
    }
    this.save = this.registry.get('save') as SaveGame;
    this.registry.set('classKey', this.save.classKey);

    const ps = SPAWNS.find((s) => s.type === 'player')!;
    const spawn = { x: ps.x * 16 + 8, y: ps.y * 16 + 8 };
    this.registry.set('souls', this.save.souls);
    this.registry.set('flasks', TUNING.flasks);
    this.registry.set(
      'pendingDrop',
      this.save.droppedSouls && this.save.droppedSouls.zone === 'graveyard'
        ? { x: this.save.droppedSouls.x, y: this.save.droppedSouls.y, amount: this.save.droppedSouls.amount }
        : null,
    );
    this.registry.set('hint', STRINGS.controls);
    this.registry.set('bossActive', false);
    this.registry.set('bossDefeated', this.save.flags.includes('warden_dead'));
    this.dying = false;
    this.soulDrop = null;
    this.boss = null;

    // ── алтари (id по порядку в SPAWNS) ──
    const shrineSpawns = SPAWNS.filter((s) => s.type === 'shrine');
    this.shrines = shrineSpawns.map((s) => new Shrine(this, s.x * 16 + 8, s.y * 16 + 8));
    this.shrineIds = shrineSpawns.map((_, i) => `shrine-${i}`);
    this.keyE = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // чекпоинт: алтарь из сейва или точка входа
    const cpIdx = this.shrineIds.indexOf(this.save.checkpoint.shrineId);
    const cp =
      this.save.checkpoint.zone === 'graveyard' && cpIdx >= 0
        ? { x: this.shrines[cpIdx].x, y: this.shrines[cpIdx].y + 14 }
        : spawn;
    this.registry.set('checkpoint', cp);

    const classDef = classByKey(this.save.classKey);
    this.player = new Player(this, cp.x, cp.y, classDef);
    this.physics.add.collider(this.player, this.layer);

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
      // слэм босса — круговой: за пределами радиуса не задевает
      const radius = zone.getData('radius') as number | undefined;
      if (
        radius !== undefined &&
        Phaser.Math.Distance.Between(zone.x, zone.y, this.player.x, this.player.y) > radius
      ) {
        return;
      }
      this.player.takeHit(
        zone.getData('damage') as number,
        (zone.getData('fromX') as number) ?? zone.x,
        (zone.getData('fromY') as number) ?? zone.y,
      );
    });
    this.physics.add.overlap(this.playerProjectiles, this.enemies, (a, b) => {
      const [p, enemyObj] = pick<Phaser.Physics.Arcade.Sprite>(a, b, (o) =>
        this.playerProjectiles.contains(o as Phaser.GameObjects.GameObject),
      );
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
    this.events.on(
      'enemy-died',
      (e: { soulValue: number; x: number; y: number; drops?: DropDef[] }) => {
        this.registry.set('souls', ((this.registry.get('souls') as number) ?? 0) + e.soulValue);
        this.save.stats.kills += 1;
        rollDrops(this, this.player, e.drops, e.x, e.y);
      },
    );
    this.events.on('loot-picked', () => this.persistNow());
    this.events.on('player-died', () => this.onPlayerDied());

    // всплывающие цифры урона
    this.events.on('float-text', (e: { x: number; y: number; text: string; tint: number }) => {
      const t = uiText(this, e.x, e.y, e.text, e.tint).setOrigin(0.5).setDepth(9000);
      this.tweens.add({
        targets: t,
        y: e.y - 14,
        alpha: 0,
        duration: 600,
        ease: 'Cubic.easeOut',
        onComplete: () => t.destroy(),
      });
    });

    // ── атаки босса ──
    this.events.on(
      'boss-swipe',
      (e: { x: number; y: number; damage: number; fromX: number; fromY: number; size: number }) => {
        const zone = spawnMeleeHitbox(this, this.enemyHitboxes, e.x, e.y, e.size, e.size, e.damage, 180);
        zone.setData('fromX', e.fromX);
        zone.setData('fromY', e.fromY);
      },
    );
    this.events.on('boss-slam', (e: { x: number; y: number; damage: number; radius: number }) => {
      const zone = spawnMeleeHitbox(this, this.enemyHitboxes, e.x, e.y, e.radius * 2, e.radius * 2, e.damage, 200);
      zone.setData('radius', e.radius);
      this.cameras.main.shake(180, 0.012);
    });
    this.events.on('boss-defeated', () => {
      setFlag(this.save, 'warden_dead');
      addItem(this.save.inventory, 'warden_heart');
      this.events.emit('float-text', {
        x: this.player.x,
        y: this.player.y - 16,
        text: '+сердце стража',
        tint: UI.blood,
      });
      this.persistNow();
      this.onBossDefeated();
    });

    // scene.restart() НЕ снимает слушателей — без этого они копятся
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const ev of [
        'player-melee', 'player-cast', 'enemy-melee', 'enemy-cast', 'enemy-died',
        'player-died', 'boss-swipe', 'boss-slam', 'boss-defeated', 'float-text', 'loot-picked',
      ]) {
        this.events.off(ev);
      }
    });

    // ── камера и HUD ──
    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    cam.startFollow(this.player, true, 0.12, 0.12);
    this.scene.launch('hud');

    // дроп душ из сейва (после смерти в прошлой сессии)
    this.refreshSoulDrop();

    // инвентарь: Tab / I (overlay поверх паузы)
    const openInventory = () => {
      if (this.player.state === 'dead' || this.scene.isPaused()) return;
      this.scene.pause();
      this.scene.launch('inventory');
    };
    this.input.keyboard!.on('keydown-TAB', (ev: KeyboardEvent) => {
      ev.preventDefault();
      openInventory();
    });
    this.input.keyboard!.on('keydown-I', openInventory);

    // ── атмосфера: виньетка, туман, частицы, свечение огней ──
    this.atmosphere = new Atmosphere(
      this,
      { tint: { color: 0x1f1833, alpha: 0.1 }, fogDensity: 1, particles: ['dust'] },
      map.widthInPixels,
      map.heightInPixels,
    );
    // свечение у свечей и алтарей по данным карты
    for (let ty = 0; ty < data.length; ty++) {
      for (let tx = 0; tx < data[ty].length; tx++) {
        const t = data[ty][tx];
        if (t === 9) this.atmosphere.addGlow(tx * 16 + 8, ty * 16 + 8, 0xc96b2e, 0.45, 0.55);
        if (t === 10) this.atmosphere.addGlow(tx * 16 + 8, ty * 16 + 5, 0xc9a227, 0.7, 0.5);
      }
    }
  }

  // ── враги: спавн и респавн (правило алтаря) ──
  private spawnEnemies(): void {
    this.enemies.clear(true, true);
    this.boss = null;
    for (const s of SPAWNS) {
      if (s.type === 'gravehound' || s.type === 'acolyte') {
        const enemy = new Enemy(this, s.x * 16 + 8, s.y * 16 + 8, ENEMIES[s.type]);
        this.enemies.add(enemy);
      } else if (s.type === 'boss' && !(this.registry.get('bossDefeated') as boolean)) {
        this.boss = new MiniBoss(this, s.x * 16 + 8, s.y * 16 + 8);
        this.enemies.add(this.boss);
        this.registry.set('bossActive', false);
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
  private restAtShrine(shrineIdx: number): void {
    this.registry.set('flasks', TUNING.flasks);
    this.registry.set('checkpoint', { x: this.player.x, y: this.player.y });
    this.save.checkpoint = { zone: 'graveyard', shrineId: this.shrineIds[shrineIdx] };
    this.player.revive(this.player.x, this.player.y);
    this.spawnEnemies(); // отдых воскрешает мир
    this.persistNow();
    this.cameras.main.flash(400, 201, 162, 39, false);
    this.atmosphere.shrineBurst(this.player.x, this.player.y - 6);
    this.showBanner(STRINGS.rested, UI.gold);
  }

  // Сейв: души из registry + текущее состояние
  persistNow(): void {
    this.save.souls = (this.registry.get('souls') as number) ?? 0;
    persist(this.save);
  }

  // ── смерть и возрождение ──
  private onPlayerDied(): void {
    if (this.dying) return;
    this.dying = true;

    const souls = (this.registry.get('souls') as number) ?? 0;
    this.registry.set('pendingDrop', souls > 0 ? { x: this.player.x, y: this.player.y, amount: souls } : null);
    this.registry.set('souls', 0);
    this.save.stats.deaths += 1;
    this.save.droppedSouls =
      souls > 0 ? { zone: 'graveyard', x: this.player.x, y: this.player.y, amount: souls } : null;
    this.persistNow();

    const text = uiText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, STRINGS.youDied, UI.blood, 3)
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
      this.save.droppedSouls = null;
      this.persistNow();
      sprite.destroy();
      this.soulDrop = null;
      this.showBanner(`${STRINGS.soulsRecovered}: ${drop.amount}`, UI.cyan);
    });
  }

  // ── победа ──
  private onBossDefeated(): void {
    this.registry.set('bossDefeated', true);
    this.time.delayedCall(1200, () => {
      const overlay = this.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d0a14, 0)
        .setScrollFactor(0)
        .setDepth(9999);
      this.tweens.add({ targets: overlay, fillAlpha: 0.75, duration: 900 });

      const mk = (y: number, msg: string, tint: number, scale = 1) =>
        uiText(this, GAME_WIDTH / 2, y, msg, tint, scale)
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(10000)
          .setAlpha(0);

      const t1 = mk(66, STRINGS.victory, UI.gold, 2);
      const t2 = mk(92, STRINGS.victorySub, UI.fog);
      const t3 = mk(112, `${STRINGS.souls}: ${(this.registry.get('souls') as number) ?? 0}`, UI.cyan);
      const t4 = mk(140, STRINGS.backToTitle, UI.bone);
      this.tweens.add({ targets: [t1, t2, t3, t4], alpha: 1, duration: 900, delay: 400 });

      this.input.keyboard!.once('keydown-ENTER', () => {
        this.scene.stop('hud');
        this.scene.start('title');
      });
    });
  }

  private showBanner(msg: string, tint: number): void {
    const banner = uiText(this, GAME_WIDTH / 2, GAME_HEIGHT - 30, msg, tint)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10000);
    this.tweens.add({ targets: banner, alpha: 0, delay: 1600, duration: 500, onComplete: () => banner.destroy() });
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);
    this.atmosphere.update(delta, this.cameras.main);
    for (const obj of this.enemies.getChildren()) {
      (obj as Enemy).update(this.player);
    }

    // вход в склеп будит Стража
    if (
      this.boss &&
      this.boss.bossState === 'dormant' &&
      this.player.y < 11 * 16 &&
      this.player.x > 21 * 16 &&
      this.player.x < 40 * 16
    ) {
      this.boss.activate();
    }

    // подсказка и отдых у алтаря
    if (this.player.state !== 'dead') {
      const nearIdx = this.shrines.findIndex(
        (s) => Phaser.Math.Distance.Between(s.x, s.y, this.player.x, this.player.y) < SHRINE_RADIUS,
      );
      if (nearIdx >= 0) {
        this.registry.set('hint', STRINGS.restHint);
        if (Phaser.Input.Keyboard.JustDown(this.keyE)) this.restAtShrine(nearIdx);
      } else if (this.registry.get('hint') === STRINGS.restHint) {
        this.registry.set('hint', '');
      }
    }
  }
}
