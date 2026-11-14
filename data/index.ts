// Ponto único de acesso aos dados falsos. Importe daqui (ex.: `import { buildings } from '../../data'`)
// em vez de importar os .json direto — assim, quando houver backend, só este arquivo muda.
import type { Building, CampusEvent, DaySchedule, Friend } from '../src/types';

import buildingsJson from './buildings.json';
import scheduleJson from './schedule.json';
import friendsJson from './friends.json';
import eventsJson from './events.json';

export const buildings = buildingsJson as Building[];
export const schedule = scheduleJson as DaySchedule;
export const friends = friendsJson as Friend[];
export const events = eventsJson as CampusEvent[];

const buildingsById = new Map(buildings.map((b) => [b.id, b]));

/** Busca um prédio pelo id. Lança erro se o id não existir (ajuda a achar erros nos JSONs). */
export function getBuilding(id: string): Building {
  const building = buildingsById.get(id);
  if (!building) throw new Error(`Unknown buildingId "${id}" — check /data/buildings.json`);
  return building;
}

/**
 * "Agora" fixo para a demo, para o mapa sempre mostrar um meio de dia interessante
 * (igual ao Figma: "Today · 11:15 AM"). Troque por `null` para usar o relógio real.
 */
export const DEMO_NOW: string | null = '11:15';
