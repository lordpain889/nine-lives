import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { journalLines } from '../systems/quests';
import { itemById } from '../config/items';
import { addPanel } from '../ui/panel';
import { uiText, UI } from '../ui/text';
import type { SaveGame } from '../types';

// Журнал квестов (J): активные с прогрессом, сданные — приглушённо.
export class JournalScene extends Phaser.Scene {
  constructor() {
    super('journal');
  }

  create(): void {
    const save = this.registry.get('save') as SaveGame;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0d0a14, 0.82).setOrigin(0);
    uiText(this, GAME_WIDTH / 2, 12, 'журнал', UI.gold, 2).setOrigin(0.5);
    addPanel(this, 10, 26, GAME_WIDTH - 20, 140);

    const lines = journalLines(save);
    if (!lines.length) {
      uiText(this, GAME_WIDTH / 2, 90, 'пока никто ничего не поручал.', UI.fog).setOrigin(0.5);
    }
    lines.slice(0, 10).forEach((l, i) => {
      const y = 34 + i * 13;
      const q = l.quest;
      let status = '';
      let tint: number = UI.bone;
      if (l.state === 'turnedIn') {
        status = '— сдано';
        tint = 0x4a4462;
      } else if (l.state === 'done') {
        status = '— выполнено, вернись за наградой';
        tint = UI.gold;
      } else if (q.type === 'kill' || q.type === 'killBoss') {
        status = `${l.progress}/${q.count}`;
      } else if (q.type === 'collect') {
        status = `собери: ${itemById(q.target).nameRu} ×${q.count}`;
      } else {
        status = 'разведай';
      }
      uiText(this, 20, y, `${q.nameRu}  ${status}`, tint);
    });

    const close = () => {
      this.scene.stop();
      this.scene.resume('game');
    };
    this.input.keyboard!.on('keydown-J', close);
    this.input.keyboard!.on('keydown-ESC', close);
  }
}
