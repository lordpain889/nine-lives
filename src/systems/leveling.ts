import type { Attrs } from '../types';

// Прокачка в духе Dark Souls: души → уровень, уровень = +1 очко атрибута.
// Кривая растёт: ранние уровни дешёвые, дальше — фарм.

export function levelCost(level: number): number {
  return Math.floor(60 * Math.pow(1.22, level - 1));
}

export interface AttrDef {
  key: keyof Attrs;
  nameRu: string;
  descRu: string;
  perPointRu: string;
}

export const ATTRS: AttrDef[] = [
  { key: 'vit', nameRu: 'живучесть', descRu: 'девять жизней любят запас', perPointRu: '+6 HP' },
  { key: 'end', nameRu: 'выносливость', descRu: 'дыхание для ударов и перекатов', perPointRu: '+5 выносл' },
  { key: 'str', nameRu: 'сила', descRu: 'тяжесть лапы', perPointRu: '+2 урона' },
  { key: 'dex', nameRu: 'ловкость', descRu: 'скорость охотника', perPointRu: '+2 скор' },
];

export const ATTR_BONUS = {
  vit: { hp: 6 },
  end: { stamina: 5 },
  str: { damage: 2 },
  dex: { speed: 2 },
} as const;

export function emptyAttrs(): Attrs {
  return { vit: 0, end: 0, str: 0, dex: 0 };
}
