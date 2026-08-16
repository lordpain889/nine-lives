import type { NpcKind } from '../entities/Npc';

export type QuestType = 'kill' | 'collect' | 'reachZone' | 'killBoss';

export interface QuestDef {
  id: string;
  giver: NpcKind;
  nameRu: string;
  type: QuestType;
  target: string; //  ключ врага / id предмета / ключ зоны / ключ босса
  count: number;
  rewards: { souls?: number; items?: { id: string; qty: number }[] };
  dialog: { offer: string[]; active: string[]; complete: string[] };
  prereq?: string; //     id квеста, который должен быть сдан
  unlocksFlag?: string;
  flagOn?: 'accept' | 'turnIn'; // когда ставить флаг (по умолчанию turnIn)
}

// Цепочка из 7 квестов ведёт через все зоны.
export const QUESTS: QuestDef[] = [
  {
    id: 'q1_rats',
    giver: 'quartermaster',
    nameRu: 'Чумные крысы',
    type: 'kill',
    target: 'rat',
    count: 6,
    rewards: { souls: 60 },
    dialog: {
      offer: [
        'крысы лезут из всех щелей.\nгород держится из последних лап.',
        'зачисти переулки — шесть хвостов.\nплачу костями.',
      ],
      active: ['крысы сами себя не перебьют.\nпереулки, котик. переулки.'],
      complete: ['шесть хвостов. чисто сработано.\nдержи кости.'],
    },
  },
  {
    id: 'q2_bones',
    giver: 'blacksmith',
    nameRu: 'Молот и кость',
    type: 'collect',
    target: 'bone_hound',
    count: 3,
    rewards: { souls: 40 },
    dialog: {
      offer: [
        'гробовая сталь любит костяную золу.\nпринеси три кости гончих с кладбища.',
      ],
      active: ['кости, котик. три штуки.\nгончие сами отдадут, если попросить когтями.'],
      complete: ['славная зола выйдет.\nтеперь могу ковать по-настоящему.'],
    },
  },
  {
    id: 'q3_path',
    giver: 'quartermaster',
    nameRu: 'Тропа в чащу',
    type: 'reachZone',
    target: 'forest',
    count: 1,
    rewards: { souls: 50 },
    prereq: 'q1_rats',
    unlocksFlag: 'forest_open',
    flagOn: 'accept',
    dialog: {
      offer: [
        'на западе лес. проклятый, как всё тут.\nразведай тропу — я открою калитку.',
      ],
      active: ['калитка открыта. лес ждёт.\nне дай туману себя съесть.'],
      complete: ['вернулся. значит, тропа есть.\nхорошая новость за долгое время.'],
    },
  },
  {
    id: 'q4_wolves',
    giver: 'quartermaster',
    nameRu: 'Волчья стая',
    type: 'kill',
    target: 'wolf',
    count: 5,
    rewards: { souls: 120, items: [{ id: 'wolf_hide', qty: 1 }] },
    prereq: 'q3_path',
    dialog: {
      offer: ['стая режет всех, кто сунется в лес.\nпять волков — и тропа станет безопасней.'],
      active: ['волки ещё воют.\nя слышу их отсюда.'],
      complete: ['тише стало. слышишь?\nвот твоя награда, охотник.'],
    },
  },
  {
    id: 'q5_essence',
    giver: 'blacksmith',
    nameRu: 'Свет для мёртвых',
    type: 'collect',
    target: 'spirit_essence',
    count: 3,
    rewards: { souls: 100, items: [{ id: 'key_catacombs', qty: 1 }] },
    prereq: 'q2_bones',
    unlocksFlag: 'catacombs_open',
    dialog: {
      offer: [
        'духи в лесу светятся не просто так.\nих эссенция открывает костяные замки.',
        'принеси три — выкую ключ от катакомб.',
      ],
      active: ['эссенции, котик. три.\nдухи не кусаются... сильно.'],
      complete: ['вот. костяной ключ.\nкатакомбы под собором теперь твои.'],
    },
  },
  {
    id: 'q6_skeletons',
    giver: 'quartermaster',
    nameRu: 'Во тьму',
    type: 'kill',
    target: 'skeleton',
    count: 4,
    rewards: { souls: 150, items: [{ id: 'key_cathedral', qty: 1 }] },
    prereq: 'q5_essence',
    unlocksFlag: 'cathedral_open',
    dialog: {
      offer: [
        'в катакомбах стоит старая стража.\nкости в доспехах. четыре — минимум.',
        'справишься — отдам золотой ключ от собора.',
      ],
      active: ['стража всё ещё стоит.\nбей, когда опустят щит.'],
      complete: ['четыре груды костей.\nзолотой ключ твой. собор ждёт.'],
    },
  },
  {
    id: 'q7_cardinal',
    giver: 'quartermaster',
    nameRu: 'Сердце собора',
    type: 'killBoss',
    target: 'cardinal',
    count: 1,
    rewards: { souls: 500 },
    prereq: 'q6_skeletons',
    dialog: {
      offer: [
        'вся чума течёт из собора.\nтам сидит кардинал. он давно не кот.',
        'убей его — и городу станет легче дышать.\nэто последняя работа, обещаю.',
      ],
      active: ['собор всё ещё дышит чумой.\nкардинал ждёт.'],
      complete: ['ты сделал это. чума отступает.\nдевять жизней — и все твои.'],
    },
  },
];

export function questById(id: string): QuestDef {
  const q = QUESTS.find((x) => x.id === id);
  if (!q) throw new Error(`Unknown quest: ${id}`);
  return q;
}
