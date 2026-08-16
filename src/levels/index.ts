import type { ZoneDef, ZoneKey } from '../types';
import { graveyardZone } from './graveyard';
import { townZone } from './town';
import { forestZone } from './forest';

// Реестр зон. Новые зоны добавляются сюда.
const ZONES: Partial<Record<ZoneKey, ZoneDef>> = {
  graveyard: graveyardZone,
  town: townZone,
  forest: forestZone,
};

export function zoneByKey(key: ZoneKey): ZoneDef {
  const zone = ZONES[key];
  if (!zone) throw new Error(`Zone not implemented yet: ${key}`);
  return zone;
}
