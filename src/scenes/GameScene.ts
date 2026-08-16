import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { classByKey, COLLIDING_TILES } from '../config/gameData';
import { buildTestMap } from '../levels/test';

export class GameScene extends Phaser.Scene {
  private player!: Player;

  constructor() {
    super('game');
  }

  create(): void {
    const data = buildTestMap();
    const map = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
    const tileset = map.addTilesetImage('tiles', 'tiles', 16, 16)!;
    const layer = map.createLayer(0, tileset, 0, 0)!;
    layer.setCollision(COLLIDING_TILES);

    const classDef = classByKey(this.registry.get('classKey') as string);
    this.player = new Player(this, 21 * 16, 16 * 16, classDef);
    this.physics.add.collider(this.player, layer);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    cam.startFollow(this.player, true, 0.12, 0.12);
  }

  update(): void {
    this.player.update();
  }
}
