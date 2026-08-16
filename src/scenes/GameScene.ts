import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { MiniBoss } from '../entities/MiniBoss';
import { Shrine } from '../entities/Shrine';
import { Npc, NpcKind } from '../entities/Npc';
import {
  classByKey,
  COLLIDING_TILES,
  TOWN_COLLIDING,
  TILES,
  TOWN_TILES,
  ENEMIES,
  STRINGS,
  TUNING,
} from '../config/gameData';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { zoneByKey } from '../levels';
import { spawnMeleeHitbox } from '../systems/combat';
import { Atmosphere } from '../systems/atmosphere';
import { rollDrops } from '../systems/loot';
import { slash, hitSparks, deathBurst, rollDust } from '../systems/effects';
import { newSave, persist, setFlag, hasFlag } from '../systems/save';
import { addItem, itemById } from '../config/items';
import { SpiritEnemy } from '../entities/SpiritEnemy';
import { Cardinal } from '../entities/Cardinal';
import {
  availableQuest,
  pendingQuest,
  acceptQuest,
  isQuestDone,
  turnInQuest,
  onEnemyKilled,
  onZoneReached,
} from '../systems/quests';
import type { QuestDef } from '../config/quests';
import { DialogBox } from '../ui/DialogBox';
import { NPC_CHATTER, SHRINE_LINES, DEATH_LINES } from '../config/lore';
import { uiText, UI } from '../ui/text';
import type { DropDef, SaveGame, ZoneDef, ZoneKey } from '../types';

const SHRINE_RADIUS = 22;
const NPC_RADIUS = 20;

interface GameSceneData {
  zone?: ZoneKey;
  spawnTile?: { x: number; y: number };
  // состояние переносится между зонами: переход НЕ должен лечить
  carry?: { hp: number; stamina: number; flasks: number };
}

export class GameScene extends Phaser.Scene {
  player!: Player;
  dialog!: DialogBox;
  private zone!: ZoneDef;
  private enemies!: Phaser.GameObjects.Group;
  private boss: MiniBoss | null = null;
  private cardinal: Cardinal | null = null;
  private spikes: Array<{ sprite: Phaser.GameObjects.Sprite; phase: number }> = [];
  private shrines: Shrine[] = [];
  private shrineIds: string[] = [];
  private npcs: Npc[] = [];
  private soulDrop: Phaser.Physics.Arcade.Sprite | null = null;
  private playerHitboxes!: Phaser.Physics.Arcade.Group;
  private enemyHitboxes!: Phaser.Physics.Arcade.Group;
  private playerProjectiles!: Phaser.Physics.Arcade.Group;
  private enemyProjectiles!: Phaser.Physics.Arcade.Group;
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private keyE!: Phaser.Input.Keyboard.Key;
  private dying = false;
  private transitioning = false;
  private lockedTextAt = 0;
  private atmosphere!: Atmosphere;
  private save!: SaveGame;
  private spawnTileOverride: { x: number; y: number } | null = null;
  private carry: { hp: number; stamina: number; flasks: number } | null = null;
  private chatterIdx: Record<string, number> = {};

  constructor() {
    super('game');
  }

  init(data: GameSceneData): void {
    this.spawnTileOverride = data?.spawnTile ?? null;
    this.carry = data?.carry ?? null;
    if (data?.zone) this.registry.set('currentZone', data.zone);
  }

  create(): void {
    // ── сейв и зона ──
    if (!this.registry.has('save')) {
      this.registry.set('save', newSave((this.registry.get('classKey') as SaveGame['classKey']) ?? 'knight'));
    }
    this.save = this.registry.get('save') as SaveGame;
    this.registry.set('classKey', this.save.classKey);

    const zoneKey = (this.registry.get('currentZone') as ZoneKey) ?? this.save.checkpoint.zone;
    this.registry.set('currentZone', zoneKey);
    this.zone = zoneByKey(zoneKey);

    // ── карта ──
    const { ground, decor } = this.zone.buildMap();
    const map = this.make.tilemap({ data: ground, tileWidth: 16, tileHeight: 16 });
    const tileset = map.addTilesetImage('tiles', 'tiles', 16, 16)!;
    this.layer = map.createLayer(0, tileset, 0, 0)!;
    this.layer.setCollision([...COLLIDING_TILES, ...TOWN_COLLIDING]);

    const decorMap = this.make.tilemap({ data: decor, tileWidth: 16, tileHeight: 16 });
    decorMap.addTilesetImage('tiles', 'tiles', 16, 16);
    decorMap.createLayer(0, 'tiles', 0, 0)!.setDepth(1);

    this.cameras.main.setBackgroundColor(this.zone.ambient.bgColor);

    // ── состояние забега ──
    this.registry.set('souls', this.save.souls);
    this.registry.set('flasks', this.carry ? this.carry.flasks : TUNING.flasks);
    this.registry.set(
      'pendingDrop',
      this.save.droppedSouls && this.save.droppedSouls.zone === zoneKey
        ? { x: this.save.droppedSouls.x, y: this.save.droppedSouls.y, amount: this.save.droppedSouls.amount }
        : null,
    );
    this.registry.set('hint', STRINGS.controls);
    this.registry.set('bossActive', false);
    this.registry.set('bossDefeated', hasFlag(this.save, 'warden_dead'));
    this.registry.set('dialogOpen', false);
    this.dying = false;
    this.transitioning = false;
    this.soulDrop = null;
    this.boss = null;
    this.cardinal = null;
    this.spikes = [];

    // ── алтари и NPC ──
    const shrineSpawns = this.zone.spawns.filter((s) => s.type === 'shrine');
    this.shrines = shrineSpawns.map((s) => new Shrine(this, s.x * 16 + 8, s.y * 16 + 8));
    this.shrineIds = shrineSpawns.map((_, i) => `${zoneKey}-shrine-${i}`);
    this.keyE = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.npcs = this.zone.spawns
      .filter((s) => s.type.startsWith('npc-'))
      .map((s) => new Npc(this, s.x * 16 + 8, s.y * 16 + 8, s.type.slice(4) as NpcKind));

    // ── позиция игрока: переход > чекпоинт этой зоны > вход зоны ──
    const ps = this.zone.spawns.find((s) => s.type === 'player')!;
    let spawn = { x: ps.x * 16 + 8, y: ps.y * 16 + 8 };
    const cpIdx = this.shrineIds.indexOf(this.save.checkpoint.shrineId);
    if (this.spawnTileOverride) {
      spawn = { x: this.spawnTileOverride.x * 16 + 8, y: this.spawnTileOverride.y * 16 + 8 };
    } else if (this.save.checkpoint.zone === zoneKey && cpIdx >= 0) {
      spawn = { x: this.shrines[cpIdx].x, y: this.shrines[cpIdx].y + 14 };
    }
    this.registry.set(
      'checkpoint',
      this.save.checkpoint.zone === zoneKey && cpIdx >= 0
        ? { x: this.shrines[cpIdx].x, y: this.shrines[cpIdx].y + 14 }
        : spawn,
    );

    this.player = new Player(this, spawn.x, spawn.y, classByKey(this.save.classKey));
    // переход между зонами сохраняет HP/стамину (иначе зоны = бесплатный хил)
    if (this.carry) {
      this.player.hp = Math.min(this.player.stats.maxHp, this.carry.hp);
      this.player.stamina = Math.min(this.player.stats.maxStamina, this.carry.stamina);
      this.player.recomputeStats();
    }
    this.physics.add.collider(this.player, this.layer);
    this.dialog = new DialogBox(this);

    // ── группы боёвки ──
    this.enemies = this.add.group();
    this.playerHitboxes = this.physics.add.group();
    this.enemyHitboxes = this.physics.add.group();
    this.playerProjectiles = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group();

    this.physics.add.collider(this.enemies, this.layer);
    this.physics.add.collider(this.player, this.enemies);
    this.spawnEnemies();

    // ── выходы из зоны ──
    for (const exit of this.zone.exits) {
      const zone = this.add.zone(
        exit.x * 16 + (exit.w * 16) / 2,
        exit.y * 16 + (exit.h * 16) / 2,
        exit.w * 16,
        exit.h * 16,
      );
      this.physics.add.existing(zone, true);
      this.physics.add.overlap(this.player, zone, () => {
        if (this.transitioning || this.player.state === 'dead') return;
        if (exit.lockFlag && !hasFlag(this.save, exit.lockFlag)) {
          if (this.time.now > this.lockedTextAt + 2500) {
            this.lockedTextAt = this.time.now;
            this.showBanner(exit.lockedTextRu ?? 'закрыто.', UI.fog);
          }
          return;
        }
        this.startTransition(exit.toZone, { x: exit.toX, y: exit.toY });
      });
    }

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
      slash(this, e.x, e.y, Math.atan2(e.y - this.player.y, e.x - this.player.x), 0xf2ede4);
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
        slash(this, e.x, e.y, Math.atan2(e.y - e.fromY, e.x - e.fromX), 0x8c2233);
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
      'enemy-lob',
      (e: { x: number; y: number; targetX: number; targetY: number; damage: number }) => {
        this.lobFlask(e.x, e.y, e.targetX, e.targetY, e.damage);
      },
    );
    this.events.on(
      'enemy-died',
      (e: { key?: string; soulValue: number; x: number; y: number; drops?: DropDef[] }) => {
        this.registry.set('souls', ((this.registry.get('souls') as number) ?? 0) + e.soulValue);
        this.save.stats.kills += 1;
        deathBurst(this, e.x, e.y);
        rollDrops(this, this.player, e.drops, e.x, e.y);
        if (e.key) {
          const doneName = onEnemyKilled(this.save, e.key);
          if (doneName) this.showBanner(`${doneName} — выполнено`, UI.gold);
          this.persistNow();
        }
      },
    );
    // стая агрится вместе
    this.events.on('pack-aggro', (e: { key: string; x: number; y: number }) => {
      for (const obj of this.enemies.getChildren()) {
        const en = obj as Enemy;
        if (
          en.def?.key === e.key &&
          en.enemyState === 'patrol' &&
          Phaser.Math.Distance.Between(en.x, en.y, e.x, e.y) < 100
        ) {
          en.enemyState = 'aggro';
        }
      }
    });
    this.events.on('loot-picked', () => this.persistNow());
    this.events.on('roll-fx', (e: { x: number; y: number }) => rollDust(this, e.x, e.y));
    this.events.on('player-died', () => this.onPlayerDied());

    // всплывающие цифры урона + искры в точке попадания
    this.events.on('float-text', (e: { x: number; y: number; text: string; tint: number }) => {
      if (/^\d+$/.test(e.text)) hitSparks(this, e.x, e.y + 6, e.tint, 6);
      const t = uiText(this, e.x, e.y, e.text, e.tint).setOrigin(0.5).setDepth(9600);
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
    this.events.on('boss-defeated', (e: { boss: string }) => {
      if (e.boss === 'warden') {
        setFlag(this.save, 'warden_dead');
        this.registry.set('bossDefeated', true); // иначе респавнится у алтаря
        addItem(this.save.inventory, 'warden_heart');
        this.events.emit('float-text', {
          x: this.player.x,
          y: this.player.y - 16,
          text: '+сердце стража',
          tint: UI.blood,
        });
        this.persistNow();
        this.onBossDefeated();
      } else {
        setFlag(this.save, 'cardinal_dead');
        addItem(this.save.inventory, 'cardinal_relic');
        // финал начинается сразу — сдать q7 некому, выдаём награду здесь
        const q7 = this.save.quests['q7_cardinal'];
        if (q7 && q7.state !== 'turnedIn') {
          q7.state = 'turnedIn';
          this.registry.set('souls', ((this.registry.get('souls') as number) ?? 0) + 500);
        }
        this.persistNow();
        this.onCardinalDefeated();
      }
    });

    // ── атаки Кардинала ──
    this.events.on(
      'cardinal-bolt',
      (e: { x: number; y: number; vx: number; vy: number; damage: number }) => {
        const proj = this.physics.add.sprite(e.x, e.y, 'enemies');
        this.enemyProjectiles.add(proj);
        proj.setData('damage', e.damage);
        proj.play('bolt');
        (proj.body as Phaser.Physics.Arcade.Body).setSize(8, 8);
        proj.setVelocity(e.vx, e.vy);
        proj.setDepth(proj.y + 8);
        this.time.delayedCall(2200, () => {
          if (proj.active) proj.destroy();
        });
      },
    );
    this.events.on('cardinal-summon', (e: { x: number; y: number }) => {
      const rat = new Enemy(this, e.x, e.y, ENEMIES.rat);
      rat.enemyState = 'aggro';
      this.enemies.add(rat);
      this.atmosphere.shrineBurst(e.x, e.y);
    });
    this.events.on(
      'cardinal-beam-seg',
      (e: { x: number; y: number; damage: number; radius: number }) => {
        const zone = spawnMeleeHitbox(this, this.enemyHitboxes, e.x, e.y, e.radius * 2, e.radius * 2, e.damage, 260);
        zone.setData('radius', e.radius);
      },
    );

    // scene.restart() НЕ снимает слушателей — без этого они копятся
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const ev of [
        'player-melee', 'player-cast', 'enemy-melee', 'enemy-cast', 'enemy-lob', 'enemy-died',
        'player-died', 'boss-swipe', 'boss-slam', 'boss-defeated', 'float-text', 'loot-picked',
        'pack-aggro', 'cardinal-bolt', 'cardinal-summon', 'cardinal-beam-seg', 'roll-fx',
      ]) {
        this.events.off(ev);
      }
    });

    // ── камера и HUD ──
    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    cam.startFollow(this.player, true, 0.12, 0.12);
    if (!this.scene.isActive('hud')) this.scene.launch('hud');

    // дроп душ из сейва
    this.refreshSoulDrop();

    // инвентарь: Tab / I
    const openInventory = () => {
      if (this.player.state === 'dead' || this.dialog.isOpen || this.transitioning) return;
      this.scene.pause();
      this.scene.launch('inventory');
    };
    this.input.keyboard!.on('keydown-TAB', (ev: KeyboardEvent) => {
      ev.preventDefault();
      openInventory();
    });
    this.input.keyboard!.on('keydown-I', openInventory);
    this.input.keyboard!.on('keydown-Q', () => {
      if (this.player.state === 'dead' || this.dialog.isOpen || this.transitioning) return;
      this.scene.pause();
      this.scene.launch('journal');
    });

    // квест «разведай зону»
    const reached = onZoneReached(this.save, zoneKey);
    if (reached) {
      this.time.delayedCall(800, () => this.showBanner(`${reached} — выполнено`, UI.gold));
      this.persistNow();
    }

    // ── атмосфера ──
    this.atmosphere = new Atmosphere(this, this.zone.ambient, map.widthInPixels, map.heightInPixels);
    for (let ty = 0; ty < ground.length; ty++) {
      for (let tx = 0; tx < ground[ty].length; tx++) {
        const t = ground[ty][tx];
        const px = tx * 16 + 8;
        const py = ty * 16 + 8;
        if (t === TILES.candle) this.atmosphere.addGlow(px, py, 0xc96b2e, 0.45, 0.55);
        if (t === TILES.shrineBase) this.atmosphere.addGlow(px, py - 3, 0xc9a227, 0.7, 0.5);
        if (t === TOWN_TILES.lantern) this.atmosphere.addGlow(px, py - 5, 0xc9a227, 0.55, 0.5);
        if (t === TOWN_TILES.houseWindow) this.atmosphere.addGlow(px, py, 0x3e7a4e, 0.4, 0.35);
      }
    }

    // зона-заставка
    const label = uiText(this, GAME_WIDTH / 2, 34, this.zone.nameRu, UI.gold, 2)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10000)
      .setAlpha(0);
    this.tweens.add({ targets: label, alpha: 1, duration: 500, hold: 1200, yoyo: true, onComplete: () => label.destroy() });
    this.cameras.main.fadeIn(400, 13, 10, 20);
  }

  // ── зонные переходы ──
  private startTransition(toZone: ZoneKey, spawnTile: { x: number; y: number }): void {
    this.transitioning = true;
    this.persistNow();
    const carry = {
      hp: this.player.hp,
      stamina: this.player.stamina,
      flasks: (this.registry.get('flasks') as number) ?? TUNING.flasks,
    };
    this.cameras.main.fadeOut(350, 13, 10, 20);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({ zone: toZone, spawnTile, carry });
    });
  }

  // Проходим ли тайл (для телепорта духов)
  isWalkable(px: number, py: number): boolean {
    const tile = this.layer.getTileAtWorldXY(px, py);
    return !!tile && !tile.collides;
  }

  // ── враги: спавн и респавн (правило алтаря) ──
  private spawnEnemies(): void {
    this.enemies.clear(true, true);
    this.boss = null;
    this.cardinal = null;
    for (const s of this.zone.spawns) {
      if (s.type === 'spirit') {
        this.enemies.add(new SpiritEnemy(this, s.x * 16 + 8, s.y * 16 + 8, ENEMIES.spirit));
      } else if (ENEMIES[s.type]) {
        this.enemies.add(new Enemy(this, s.x * 16 + 8, s.y * 16 + 8, ENEMIES[s.type]));
      } else if (s.type === 'boss' && !hasFlag(this.save, 'warden_dead')) {
        this.boss = new MiniBoss(this, s.x * 16 + 8, s.y * 16 + 8);
        this.enemies.add(this.boss);
        this.registry.set('bossActive', false);
      } else if (s.type === 'cardinal' && !hasFlag(this.save, 'cardinal_dead')) {
        this.cardinal = new Cardinal(this, s.x * 16 + 8, s.y * 16 + 8);
        this.enemies.add(this.cardinal);
        this.registry.set('bossActive', false);
      }
    }
    // шипы-ловушки (не враги, не респавнятся — статичны по зоне)
    if (!this.spikes.length) {
      for (const s of this.zone.spawns) {
        if (s.type !== 'spikes') continue;
        const sprite = this.add.sprite(s.x * 16 + 8, s.y * 16 + 8, 'tiles', 33).setDepth(2);
        this.spikes.push({ sprite, phase: ((s.x * 7 + s.y * 13) % 6) * 400 });
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

  // склянка чумы по дуге → облако-DoT
  private lobFlask(x: number, y: number, tx: number, ty: number, damage: number): void {
    const flask = this.add.sprite(x, y, 'enemies');
    flask.play('flask');
    flask.setDepth(9000);
    this.tweens.add({
      targets: flask,
      x: tx,
      y: ty,
      duration: 700,
      ease: 'Sine.easeIn',
      onUpdate: (tw) => flask.setScale(1 + Math.sin(tw.progress * Math.PI) * 0.6),
      onComplete: () => {
        flask.destroy();
        this.spawnCloud(tx, ty, damage);
      },
    });
  }

  private spawnCloud(x: number, y: number, damage: number): void {
    const cloud = this.add.sprite(x, y, 'enemies').setScale(1.6).setAlpha(0.85);
    cloud.play('cloud');
    cloud.setDepth(y + 8);
    const ticks = this.time.addEvent({
      delay: 450,
      repeat: 5,
      callback: () => {
        if (this.player.state === 'dead') return;
        if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 16) {
          this.player.takeHit(Math.round(damage / 2), x, y);
        }
      },
    });
    this.time.delayedCall(2700, () => {
      ticks.remove();
      this.tweens.add({ targets: cloud, alpha: 0, duration: 400, onComplete: () => cloud.destroy() });
    });
  }

  // ── алтарь: меню (отдых / развитие) ──
  private openShrineMenu(shrineIdx: number): void {
    const line = SHRINE_LINES[(shrineIdx + this.save.stats.deaths) % SHRINE_LINES.length];
    this.dialog.open({
      name: 'алтарь девяти',
      pages: [line],
      choices: [
        { label: 'отдохнуть', cb: () => this.restAtShrine(shrineIdx) },
        {
          label: 'развитие',
          cb: () => {
            this.scene.pause();
            this.scene.launch('levelup');
          },
        },
        { label: 'уйти', cb: () => undefined },
      ],
    });
  }

  // ── алтарь ──
  private restAtShrine(shrineIdx: number): void {
    this.registry.set('flasks', TUNING.flasks);
    this.registry.set('checkpoint', { x: this.player.x, y: this.player.y });
    this.save.checkpoint = {
      zone: this.registry.get('currentZone') as ZoneKey,
      shrineId: this.shrineIds[shrineIdx],
    };
    this.player.revive(this.player.x, this.player.y);
    this.spawnEnemies(); // отдых воскрешает мир
    this.persistNow();
    this.cameras.main.flash(400, 201, 162, 39, false);
    this.atmosphere.shrineBurst(this.player.x, this.player.y - 6);
    this.showBanner(STRINGS.rested, UI.gold);
  }

  persistNow(): void {
    this.save.souls = (this.registry.get('souls') as number) ?? 0;
    persist(this.save);
  }

  // ── NPC: квесты + ремесло ──
  private craftChoice(npc: Npc): { label: string; cb: () => void }[] {
    if (npc.kind === 'blacksmith') return [{ label: 'ковать', cb: () => this.openCraft('blacksmith') }];
    if (npc.kind === 'merchant') return [{ label: 'торговать', cb: () => this.openCraft('merchant') }];
    return [];
  }

  private talkTo(npc: Npc): void {
    const pending = pendingQuest(this.save, npc.kind);

    // 1. сдать выполненный квест — только по согласию (collect ест материалы!)
    if (pending && isQuestDone(this.save, pending)) {
      const cost =
        pending.type === 'collect'
          ? `\n(отдашь ${pending.count} шт: ${itemById(pending.target).nameRu})`
          : '';
      const rewardBits = [
        pending.rewards.souls ? `${pending.rewards.souls} костей` : '',
        ...(pending.rewards.items ?? []).map((i) => itemById(i.id).nameRu),
      ].filter(Boolean);
      this.dialog.open({
        name: npc.nameRu,
        pages: [`${pending.nameRu} — готово.\nнаграда: ${rewardBits.join(', ') || 'благодарность'}${cost}`],
        choices: [
          { label: 'сдать', cb: () => this.turnInFlow(npc, pending) },
          { label: 'позже', cb: () => undefined },
          ...this.craftChoice(npc),
        ],
      });
      return;
    }

    // 2. квест в процессе
    if (pending) {
      this.dialog.open({
        name: npc.nameRu,
        pages: pending.dialog.active,
        choices: [...this.craftChoice(npc), { label: 'уйти', cb: () => undefined }],
      });
      return;
    }

    // 3. предложить новый квест
    const offer = availableQuest(this.save, npc.kind);
    if (offer) {
      this.dialog.open({
        name: npc.nameRu,
        pages: offer.dialog.offer,
        choices: [
          { label: 'принять', cb: () => this.acceptQuestFlow(offer) },
          { label: 'отказаться', cb: () => undefined },
          ...this.craftChoice(npc),
        ],
      });
      return;
    }

    // 4. болтовня — по кругу из лор-набора
    const lines = NPC_CHATTER[npc.kind] ?? [['...']];
    const idx = this.chatterIdx[npc.kind] ?? 0;
    this.chatterIdx[npc.kind] = (idx + 1) % lines.length;
    this.dialog.open({
      name: npc.nameRu,
      pages: lines[idx],
      choices: this.craftChoice(npc).length
        ? [...this.craftChoice(npc), { label: 'уйти', cb: () => undefined }]
        : undefined,
    });
  }

  private turnInFlow(npc: Npc, quest: QuestDef): void {
    turnInQuest(this.save, quest);
    const souls = ((this.registry.get('souls') as number) ?? 0) + (quest.rewards.souls ?? 0);
    this.registry.set('souls', souls);
    this.persistNow();
    this.time.delayedCall(200, () =>
      this.dialog.open({
        name: npc.nameRu,
        pages: quest.dialog.complete,
        choices: [...this.craftChoice(npc), { label: 'уйти', cb: () => undefined }],
      }),
    );
  }

  private acceptQuestFlow(quest: QuestDef): void {
    acceptQuest(this.save, quest);
    this.persistNow();
    this.showBanner(`новый квест: ${quest.nameRu}`, UI.gold);
  }

  private openCraft(vendor: 'blacksmith' | 'merchant'): void {
    this.scene.pause();
    this.scene.launch('craft', { vendor });
  }

  // ── смерть и возрождение ──
  private onPlayerDied(): void {
    if (this.dying || this.transitioning) return; // смерть в переходе — игнор
    this.dying = true;
    this.dialog.close(); // иначе после воскрешения игрок заморожен

    const zoneKey = this.registry.get('currentZone') as ZoneKey;
    const souls = (this.registry.get('souls') as number) ?? 0;
    this.registry.set('pendingDrop', souls > 0 ? { x: this.player.x, y: this.player.y, amount: souls } : null);
    this.registry.set('souls', 0);
    this.save.stats.deaths += 1;
    this.save.droppedSouls =
      souls > 0 ? { zone: zoneKey, x: this.player.x, y: this.player.y, amount: souls } : null;
    this.persistNow();

    const text = uiText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 6, STRINGS.youDied, UI.blood, 3)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10000)
      .setAlpha(0);
    const sub = uiText(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 16,
      DEATH_LINES[this.save.stats.deaths % DEATH_LINES.length],
      UI.fog,
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10000)
      .setAlpha(0);
    this.tweens.add({ targets: [text, sub], alpha: 1, duration: 900 });
    this.cameras.main.zoomTo(1.08, 900, 'Sine.easeOut');

    this.time.delayedCall(2200, () => {
      this.cameras.main.fadeOut(400, 13, 10, 20);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        if (this.save.checkpoint.zone !== zoneKey) {
          // чекпоинт в другой зоне — уходим туда
          this.scene.restart({ zone: this.save.checkpoint.zone });
          return;
        }
        text.destroy();
        sub.destroy();
        this.cameras.main.zoomTo(1, 1);
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
    // если умер на чекпоинте — не подбирать мгновенно при воскрешении
    let armed = Phaser.Math.Distance.Between(drop.x, drop.y, this.player.x, this.player.y) > 24;
    this.physics.add.overlap(sprite, this.player, () => {
      if (!armed) return;
      this.registry.set('souls', ((this.registry.get('souls') as number) ?? 0) + drop.amount);
      this.registry.set('pendingDrop', null);
      this.save.droppedSouls = null;
      this.persistNow();
      sprite.destroy();
      this.soulDrop = null;
      this.showBanner(`${STRINGS.soulsRecovered}: ${drop.amount}`, UI.cyan);
    });
    // взводим подбор, когда игрок отошёл от места смерти
    const armTimer = this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        if (!sprite.active) {
          armTimer.remove();
          return;
        }
        if (!armed && Phaser.Math.Distance.Between(sprite.x, sprite.y, this.player.x, this.player.y) > 26) {
          armed = true;
          armTimer.remove();
        }
      },
    });
  }

  // ── победа над Стражем ──
  private onBossDefeated(): void {
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

      const t1 = mk(60, STRINGS.victory, UI.gold, 2);
      const t2 = mk(84, 'врата города открыты. иди на север.', UI.fog);
      const t3 = mk(104, `${STRINGS.souls}: ${(this.registry.get('souls') as number) ?? 0}`, UI.cyan);
      const t4 = mk(132, 'ENTER — продолжить путь', UI.bone);
      const items = [overlay, t1, t2, t3, t4];
      this.tweens.add({ targets: [t1, t2, t3, t4], alpha: 1, duration: 900, delay: 400 });

      this.input.keyboard!.once('keydown-ENTER', () => {
        items.forEach((i) => i.destroy());
      });
    });
  }

  // ── финал: Кардинал повержен ──
  private onCardinalDefeated(): void {
    this.time.delayedCall(1500, () => {
      const overlay = this.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d0a14, 0)
        .setScrollFactor(0)
        .setDepth(9999);
      this.tweens.add({ targets: overlay, fillAlpha: 0.85, duration: 1200 });

      const mk = (y: number, msg: string, tint: number, scale = 1) =>
        uiText(this, GAME_WIDTH / 2, y, msg, tint, scale)
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(10000)
          .setAlpha(0);

      const st = this.save.stats;
      const t1 = mk(52, STRINGS.victory, UI.gold, 2);
      const t2 = mk(76, STRINGS.victorySub, UI.fog);
      const t3 = mk(96, `убийств: ${st.kills}   смертей: ${st.deaths}`, UI.bone);
      const t4 = mk(110, `${STRINGS.souls}: ${(this.registry.get('souls') as number) ?? 0}`, UI.cyan);
      const t5 = mk(140, STRINGS.backToTitle, UI.bone);
      this.tweens.add({ targets: [t1, t2, t3, t4, t5], alpha: 1, duration: 1000, delay: 600 });

      this.input.keyboard!.once('keydown-ENTER', () => {
        this.scene.stop('hud');
        this.scene.start('title');
      });
    });
  }

  // ── интро босса в духе DS: чёрные полосы + имя ──
  bossIntro(name: string): void {
    const cy = GAME_HEIGHT / 2;
    const barTop = this.add
      .rectangle(0, cy - 26, GAME_WIDTH, 0, 0x0d0a14, 0.85)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(9800);
    const barBottom = this.add
      .rectangle(0, cy + 26, GAME_WIDTH, 0, 0x0d0a14, 0.85)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(9800);
    const label = uiText(this, GAME_WIDTH / 2, cy - 4, name, UI.blood, 2)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(9810)
      .setAlpha(0);
    const line = this.add
      .rectangle(GAME_WIDTH / 2, cy + 12, 4, 1, 0x8c2233, 1)
      .setScrollFactor(0)
      .setDepth(9810);

    this.tweens.add({ targets: [barTop, barBottom], height: 30, duration: 350, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: label, alpha: 1, duration: 500, delay: 250 });
    this.tweens.add({ targets: line, width: 180, duration: 700, delay: 350, ease: 'Cubic.easeOut' });
    this.cameras.main.zoomTo(1.12, 400, 'Sine.easeOut');
    this.time.delayedCall(2100, () => {
      this.cameras.main.zoomTo(1, 500, 'Sine.easeInOut');
      this.tweens.add({
        targets: [label, line, barTop, barBottom],
        alpha: 0,
        duration: 500,
        onComplete: () => [label, line, barTop, barBottom].forEach((o) => o.destroy()),
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

    // вход в склеп будит Стража (только кладбище)
    if (
      this.boss &&
      this.boss.bossState === 'dormant' &&
      this.player.y < 11 * 16 &&
      this.player.x > 21 * 16 &&
      this.player.x < 40 * 16
    ) {
      this.boss.activate();
    }

    // Кардинал просыпается, когда игрок входит в неф собора
    if (this.cardinal && this.cardinal.bossState === 'dormant' && this.player.y < 19 * 16) {
      this.cardinal.activate();
    }

    // шипы: цикл 2.4с (1с подняты), урон когда подняты
    for (const spike of this.spikes) {
      const up = (time + spike.phase) % 2400 < 1000;
      spike.sprite.setFrame(up ? 34 : 33);
      if (
        up &&
        this.player.state !== 'dead' &&
        Phaser.Math.Distance.Between(spike.sprite.x, spike.sprite.y, this.player.x, this.player.y) < 11
      ) {
        this.player.takeHit(12, spike.sprite.x, spike.sprite.y + 6);
      }
    }

    // маркеры квестов над NPC
    for (const npc of this.npcs) {
      const pending = pendingQuest(this.save, npc.kind);
      if (pending && isQuestDone(this.save, pending)) npc.setMarker('done');
      else if (!pending && availableQuest(this.save, npc.kind)) npc.setMarker('quest');
      else npc.setMarker(null);
    }

    // взаимодействия по E: алтарь или NPC
    if (this.player.state !== 'dead' && !this.dialog.isOpen && !this.transitioning) {
      const nearShrine = this.shrines.findIndex(
        (s) => Phaser.Math.Distance.Between(s.x, s.y, this.player.x, this.player.y) < SHRINE_RADIUS,
      );
      const nearNpc = this.npcs.find(
        (n) => Phaser.Math.Distance.Between(n.x, n.y, this.player.x, this.player.y) < NPC_RADIUS,
      );
      if (nearShrine >= 0) {
        this.registry.set('hint', STRINGS.restHint);
        if (Phaser.Input.Keyboard.JustDown(this.keyE)) this.openShrineMenu(nearShrine);
      } else if (nearNpc) {
        this.registry.set('hint', `E — ${nearNpc.nameRu}`);
        if (Phaser.Input.Keyboard.JustDown(this.keyE)) this.talkTo(nearNpc);
      } else if (this.registry.get('hint') !== STRINGS.controls) {
        this.registry.set('hint', '');
      }
    }
  }
}
