import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { TitleScene } from '../scenes/TitleScene';
import { ClassSelectScene } from '../scenes/ClassSelectScene';
import { GameScene } from '../scenes/GameScene';
import { HudScene } from '../scenes/HudScene';
import { InventoryScene } from '../scenes/InventoryScene';
import { CraftScene } from '../scenes/CraftScene';
import { JournalScene } from '../scenes/JournalScene';
import { NameEntryScene } from '../scenes/NameEntryScene';
import { LevelUpScene } from '../scenes/LevelUpScene';

export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 180;

// Максимальный ЦЕЛЫЙ зум, влезающий в окно (дробный зум = плывущие пиксели)
export function computeZoom(): number {
  return Math.max(
    1,
    Math.floor(Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT)),
  );
}

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true, //     NEAREST-фильтр + antialias off
  roundPixels: true, //  рендер снапится к пиксельной сетке
  backgroundColor: '#0d0a14',
  parent: 'game',
  scale: {
    mode: Phaser.Scale.NONE, // центрирует CSS-грид в index.html
    zoom: computeZoom(),
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [
    BootScene, TitleScene, ClassSelectScene, NameEntryScene, GameScene,
    HudScene, InventoryScene, CraftScene, JournalScene, LevelUpScene,
  ],
};
