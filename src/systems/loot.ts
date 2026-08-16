import Phaser from 'phaser';
import type { DropDef, SaveGame } from '../types';
import { addItem, itemById } from '../config/items';

// Дроп материалов с врагов: ролл таблицы → спрайт-пикап → автоподбор.

export function rollDrops(
  scene: Phaser.Scene,
  player: Phaser.Physics.Arcade.Sprite,
  drops: DropDef[] | undefined,
  x: number,
  y: number,
): void {
  if (!drops) return;
  let offset = 0;
  for (const d of drops) {
    if (Math.random() >= d.chance) continue;
    const qty = Phaser.Math.Between(d.min, d.max);
    spawnPickup(scene, player, d.id, qty, x + offset, y);
    offset += 8;
  }
}

export function spawnPickup(
  scene: Phaser.Scene,
  player: Phaser.Physics.Arcade.Sprite,
  id: string,
  qty: number,
  x: number,
  y: number,
): void {
  const def = itemById(id);
  const sprite = scene.physics.add.sprite(x, y, 'items', def.frame);
  sprite.setDepth(y);
  (sprite.body as Phaser.Physics.Arcade.Body).setSize(12, 12);
  // лёгкий подскок при выпадении
  scene.tweens.add({ targets: sprite, y: y - 5, duration: 160, yoyo: true, ease: 'Quad.easeOut' });

  // коллайдер снимаем вручную — иначе они копятся в world.colliders
  const collider = scene.physics.add.overlap(sprite, player, () => {
    if (!sprite.active) return;
    scene.physics.world.removeCollider(collider);
    sprite.disableBody(true, false);
    const save = scene.registry.get('save') as SaveGame;
    addItem(save.inventory, id, qty);
    scene.events.emit('loot-picked', { id, qty });
    scene.events.emit('float-text', {
      x: player.x,
      y: player.y - 14,
      text: `+${qty > 1 ? `${qty} ` : ''}${def.nameRu}`,
      tint: 0xd8cfc0,
    });
    scene.tweens.add({
      targets: sprite,
      y: sprite.y - 8,
      alpha: 0,
      duration: 250,
      onComplete: () => sprite.destroy(),
    });
  });
}
