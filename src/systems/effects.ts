import Phaser from 'phaser';

// Боевые эффекты: росчерки, искры, распад, пыль переката.
// Все текстуры процедурные (slash/particle/glow), ADD-blend.

// Дуга удара в направлении angleRad
export function slash(scene: Phaser.Scene, x: number, y: number, angleRad: number, tint = 0xf2ede4): void {
  const img = scene.add
    .image(x, y, 'slash')
    .setRotation(angleRad)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setTint(tint)
    .setScale(0.55)
    .setAlpha(0.95)
    .setDepth(y + 20);
  scene.tweens.add({
    targets: img,
    scale: 1.05,
    alpha: 0,
    duration: 150,
    ease: 'Cubic.easeOut',
    onComplete: () => img.destroy(),
  });
}

// Искры в точке попадания (цвет = цвет цифры урона)
export function hitSparks(scene: Phaser.Scene, x: number, y: number, tint: number, count = 7): void {
  const p = scene.add.particles(x, y, 'particle', {
    lifespan: 350,
    speed: { min: 40, max: 110 },
    alpha: { start: 1, end: 0 },
    scale: { start: 1.2, end: 0.4 },
    quantity: count,
    emitting: false,
    tint,
    blendMode: Phaser.BlendModes.ADD,
  });
  p.setDepth(y + 24);
  p.explode(count, 0, 0);
  scene.time.delayedCall(450, () => p.destroy());
}

// Распад врага при смерти (костяная пыль)
export function deathBurst(scene: Phaser.Scene, x: number, y: number, tint = 0xa89f94): void {
  const p = scene.add.particles(x, y, 'particle', {
    lifespan: 700,
    speed: { min: 15, max: 55 },
    angle: { min: 180, max: 360 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 40,
    quantity: 12,
    emitting: false,
    tint,
  });
  p.setDepth(y + 22);
  p.explode(12, 0, 0);
  scene.time.delayedCall(800, () => p.destroy());
}

// Пыль из-под лап при перекате
export function rollDust(scene: Phaser.Scene, x: number, y: number): void {
  const p = scene.add.particles(x, y + 6, 'particle', {
    lifespan: 420,
    speed: { min: 8, max: 26 },
    angle: { min: 200, max: 340 },
    alpha: { start: 0.45, end: 0 },
    scale: { start: 1.4, end: 0.6 },
    quantity: 5,
    emitting: false,
    tint: 0x6f6c8a,
  });
  p.setDepth(y + 5);
  p.explode(5, 0, 0);
  scene.time.delayedCall(500, () => p.destroy());
}
