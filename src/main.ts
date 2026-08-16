import Phaser from 'phaser';
import { gameConfig, computeZoom } from './config/gameConfig';

const game = new Phaser.Game(gameConfig);

window.addEventListener('resize', () => {
  game.scale.setZoom(computeZoom());
});
