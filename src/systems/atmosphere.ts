import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';

// Атмосфера зоны: виньетка, дрейфующий туман, свечение огней, частицы.
// Всё конфигурируется из ZoneDef.ambient (зонная система — V2-M4).

export type ParticleKind = 'dust' | 'fireflies' | 'spores' | 'embers';

export interface AmbientConfig {
  tint?: { color: number; alpha: number };
  fogDensity: 0 | 1 | 2;
  particles: ParticleKind[];
}

const FOG_ALPHA: Record<number, [number, number]> = {
  0: [0, 0],
  1: [0.1, 0.14],
  2: [0.18, 0.26],
};

export class Atmosphere {
  private scene: Phaser.Scene;
  private fog1?: Phaser.GameObjects.TileSprite;
  private fog2?: Phaser.GameObjects.TileSprite;
  private t = 0;

  constructor(scene: Phaser.Scene, cfg: AmbientConfig, worldW: number, worldH: number) {
    this.scene = scene;

    // амбиент-тинт зоны
    if (cfg.tint) {
      scene.add
        .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, cfg.tint.color, cfg.tint.alpha)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(9400);
    }

    // туман: два слоя с разной скоростью и альфой
    const [a1, a2] = FOG_ALPHA[cfg.fogDensity];
    if (cfg.fogDensity > 0) {
      this.fog1 = scene.add
        .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'fog')
        .setOrigin(0)
        .setScrollFactor(0)
        .setAlpha(a1)
        .setDepth(9300);
      this.fog2 = scene.add
        .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'fog')
        .setOrigin(0)
        .setScrollFactor(0)
        .setAlpha(a2)
        .setDepth(9310)
        .setTileScale(1.7);
    }

    // виньетка поверх всего мира (под HUD-сценой)
    scene.add.image(0, 0, 'vignette').setOrigin(0).setScrollFactor(0).setDepth(9500);

    // частицы
    for (const kind of cfg.particles) this.addParticles(kind, worldW, worldH);
  }

  private addParticles(kind: ParticleKind, worldW: number, worldH: number): void {
    const zone = {
      source: new Phaser.Geom.Rectangle(0, 0, worldW, worldH),
      type: 'random' as const,
      quantity: 1,
    };
    switch (kind) {
      case 'dust':
        this.scene.add
          .particles(0, 0, 'particle', {
            emitZone: zone,
            lifespan: 6000,
            speedX: { min: -4, max: 4 },
            speedY: { min: -2, max: 2 },
            alpha: { values: [0, 0.18, 0] },
            scale: 1,
            quantity: 1,
            frequency: 120,
            tint: 0x6f6c8a,
          })
          .setDepth(9200);
        break;
      case 'fireflies':
        this.scene.add
          .particles(0, 0, 'particle', {
            emitZone: zone,
            lifespan: 5000,
            speedX: { min: -8, max: 8 },
            speedY: { min: -6, max: 6 },
            alpha: { values: [0, 0.9, 0] },
            quantity: 1,
            frequency: 400,
            tint: [0xc9a227, 0x4fa4b8],
            blendMode: Phaser.BlendModes.ADD,
          })
          .setDepth(9200);
        break;
      case 'spores':
        this.scene.add
          .particles(0, 0, 'particle', {
            emitZone: zone,
            lifespan: 7000,
            speedY: { min: -8, max: -3 },
            speedX: { min: -2, max: 2 },
            alpha: { values: [0, 0.5, 0] },
            quantity: 1,
            frequency: 250,
            tint: 0x3e7a4e,
            blendMode: Phaser.BlendModes.ADD,
          })
          .setDepth(9200);
        break;
      case 'embers':
        this.scene.add
          .particles(0, 0, 'particle', {
            emitZone: zone,
            lifespan: 3000,
            speedY: { min: -14, max: -6 },
            speedX: { min: -3, max: 3 },
            alpha: { start: 0.8, end: 0 },
            quantity: 1,
            frequency: 600,
            tint: 0xc96b2e,
            blendMode: Phaser.BlendModes.ADD,
          })
          .setDepth(9200);
        break;
    }
  }

  // Тёплое свечение у источника огня (свеча, алтарь, гриб)
  addGlow(x: number, y: number, tint: number, scale = 0.6, alpha = 0.5): void {
    const g = this.scene.add
      .image(x, y, 'glow')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(tint)
      .setScale(scale)
      .setAlpha(alpha)
      .setDepth(8000);
    this.scene.tweens.add({
      targets: g,
      alpha: alpha * 0.6,
      scale: scale * 0.9,
      duration: 900 + ((x * 7 + y * 13) % 600), // рассинхрон пульса без Math.random
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // Искры при отдыхе у алтаря
  shrineBurst(x: number, y: number): void {
    const burst = this.scene.add.particles(x, y, 'particle', {
      lifespan: 800,
      speed: { min: 20, max: 60 },
      angle: { min: 200, max: 340 },
      alpha: { start: 1, end: 0 },
      quantity: 14,
      emitting: false,
      tint: [0xc9a227, 0xc96b2e],
      blendMode: Phaser.BlendModes.ADD,
    });
    burst.setDepth(8500);
    burst.explode(14, 0, 0);
    this.scene.time.delayedCall(1000, () => burst.destroy());
  }

  update(delta: number, cam: Phaser.Cameras.Scene2D.Camera): void {
    this.t += delta;
    if (this.fog1) {
      this.fog1.tilePositionX = cam.scrollX * 0.7 + this.t * 0.006;
      this.fog1.tilePositionY = cam.scrollY * 0.7 + this.t * 0.002;
    }
    if (this.fog2) {
      this.fog2.tilePositionX = cam.scrollX * 0.85 - this.t * 0.01;
      this.fog2.tilePositionY = cam.scrollY * 0.85 + this.t * 0.004;
    }
  }
}
