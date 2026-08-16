import Phaser from 'phaser';

// Объект, умеющий получать удар (игрок и враги реализуют).
export interface Damageable {
  takeHit(damage: number, fromX: number, fromY: number): void;
}

// Короткоживущий невидимый хитбокс мили-удара.
// Добавляется в переданную группу; оверлапы настраивает GameScene.
export function spawnMeleeHitbox(
  scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.Group,
  x: number,
  y: number,
  w: number,
  h: number,
  damage: number,
  lifetimeMs = 120,
): Phaser.GameObjects.Zone {
  const zone = scene.add.zone(x, y, w, h);
  group.add(zone);
  const body = zone.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false);
  body.moves = false;
  zone.setData('damage', damage);
  scene.time.delayedCall(lifetimeMs, () => zone.destroy());
  return zone;
}

// Отлетание от источника удара.
export function knockbackFrom(
  target: Phaser.Physics.Arcade.Sprite,
  fromX: number,
  fromY: number,
  force: number,
): void {
  const dir = new Phaser.Math.Vector2(target.x - fromX, target.y - fromY);
  if (dir.lengthSq() === 0) dir.set(0, 1);
  dir.normalize().scale(force);
  target.setVelocity(dir.x, dir.y);
}

// Белая вспышка при получении урона.
export function hitFlash(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, ms = 90): void {
  sprite.setTintFill(0xf2ede4);
  scene.time.delayedCall(ms, () => {
    if (sprite.active) sprite.clearTint();
  });
}
