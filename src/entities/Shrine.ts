import Phaser from 'phaser';

// Алтарь-чекпоинт: пламя над каменной плитой (tile shrineBase).
export class Shrine extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y - 3, 'ui');
    scene.add.existing(this);
    this.play('shrine-flame');
    this.setDepth(this.y);
  }
}
