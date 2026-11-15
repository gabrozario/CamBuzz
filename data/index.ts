// Ponto único de acesso aos dados falsos. Importe daqui (ex.: `import { buildings } from '../../data'`)
// em vez de importar os .json direto — assim, quando houver backend, só este arquivo muda.
import type {
  Building,
  BuildingOccupancyDetails,
  CampusEvent,
  CatalogCourse,
  DirectoryUser,
  FoodCategory,
  Friend,
  IncomingEventInvite,
  ISODate,
  MySchedule,
  ResourceCategory,
  ResourceLocation,
  UserProfile,
} from '../src/types';

import buildingsJson from './buildings.json';
import scheduleJson from './schedule.json';
import friendsJson from './friends.json';
import eventsJson from './events.json';
import meJson from './me.json';
import directoryJson from './directory.json';
import resourcesJson from './resources.json';
import foodJson from './food.json';
import coursesJson from './courses.json';
import invitesJson from './invites.json';

export const buildings = buildingsJson as Building[];
/** Agenda inicial do usuário (cursos + eventos). Nas telas use useSchedule() — inclui o que foi adicionado durante o uso. */
export const schedule = scheduleJson as MySchedule;
/** Catálogo de cursos e sections (amostra). No futuro: dados do gt-scheduler — ver catalogService.ts. */
export const courseCatalog = coursesJson as CatalogCourse[];
/** Convites de eventos que amigos mandam para você (demo: chegam alguns segundos depois de abrir o app). */
export const incomingInvites = invitesJson as IncomingEventInvite[];
/** Amigos iniciais. Use o hook useFriends() nas telas — ele inclui os amigos adicionados durante o uso. */
export const friends = friendsJson as Friend[];
export const events = eventsJson as CampusEvent[];
/** O usuário logado (no futuro: vem do cadastro). */
export const me = meJson as UserProfile;
/** Outros usuários do app que ainda não são seus amigos (simula a busca por email no backend). */
export const directory = directoryJson as DirectoryUser[];

export const resourceCategories = resourcesJson.categories as ResourceCategory[];
/** Food options: Dining hall, Restaurants/Coffees, Vending machines (com cardápio e nutrição de exemplo). */
export const foodCategories = foodJson.categories as FoodCategory[];
export const buildingOccupancy =resourcesJson.occupancy as Record<string, BuildingOccupancyDetails>;

const buildingsById = new Map(buildings.map((b) => [b.id, b]));

/** Busca um prédio pelo id. Lança erro se o id não existir (ajuda a achar erros nos JSONs). */
export function getBuilding(id: string): Building {
  const building = buildingsById.get(id);
  if (!building) throw new Error(`Unknown buildingId "${id}" — check /data/buildings.json`);
  return building;
}

/** Retorna os detalhes de ocupação por andar de um prédio (ex.: Clough Commons). */
export function getBuildingOccupancy(buildingId: string): BuildingOccupancyDetails | null {
  return buildingOccupancy[buildingId] ?? null;
}

/** Retorna todas as localizações de recursos do campus em um array plano. */
export const allResourceLocations: ResourceLocation[] = resourceCategories.flatMap((c) => c.locations);

/**
 * "Agora" do app. `null` = relógio REAL do celular (padrão — a agenda fica sincronizada
 * com a hora do aparelho e a linha vermelha da Week View anda sozinha).
 * Para uma apresentação sempre igual, troque por um horário fixo, ex.: '11:15'
 * (igual ao Figma: "Today · 11:15 AM").
 */
export const DEMO_NOW: string | null = '10:00';

/**
 * "Hoje" do app. `null` = data REAL do celular (padrão).
 * Para a demo fixa, use '2026-11-16' (segunda-feira com as 5 aulas do mapa).
 */
export const DEMO_TODAY: ISODate | null = '2026-11-16';
