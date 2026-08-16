import Phaser from 'phaser';
import { NPC_NAMES } from '../config/gameData';

export type NpcKind = 'blacksmith' | 'quartermaster' | 'merchant';

// Мирный житель: idle-анимация + маркер квеста над головой.
export class Npc extends Phaser.GameObjects.Sprite {
  readonly kind: NpcKind;
  readonly nameRu: string;
  private marker: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: NpcKind) {
    super(scene, x, y, 'npcs');
    this.kind = kind;
    this.nameRu = NPC_NAMES[kind];
    scene.add.existing(this);
    this.play(`npc-${kind}`);
    this.setDepth(y);

    this.marker = scene.add.image(x, y - 14, 'ui', 9).setDepth(y + 1).setVisible(false);
    scene.tweens.add({
      targets: this.marker,
      y: y - 16,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // 'quest' = «!», 'done' = «?», null — скрыть
  setMarker(state: 'quest' | 'done' | null): void {
    if (!state) {
      this.marker.setVisible(false);
      return;
    }
    this.marker.setFrame(state === 'quest' ? 9 : 10).setVisible(true);
  }

  destroy(fromScene?: boolean): void {
    this.marker.destroy();
    super.destroy(fromScene);
  }
}
