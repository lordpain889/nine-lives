import Phaser from 'phaser';

// 9-slice панель из ui.png (кадр 6, границы 4px). Origin (0,0).
export function addPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
): Phaser.GameObjects.NineSlice {
  return scene.add.nineslice(x, y, 'ui', 6, w, h, 4, 4, 4, 4).setOrigin(0, 0);
}
