import Phaser from 'phaser';
import { gameConfig, computeZoom } from './config/gameConfig';

const game = new Phaser.Game(gameConfig);

// дев-хук для отладки в консоли
(window as unknown as { __game: Phaser.Game }).__game = game;

window.addEventListener('resize', () => {
  game.scale.setZoom(computeZoom());
});
