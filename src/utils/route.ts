import { getBuilding } from '../../data';
import type { Building, ClassSession, LatLng, TimeOfDay } from '../types';
import { sortByStart, toMinutes } from './time';
import preloadedCampusCache from '../services/routing/campusRouteCache.json';

/** Uma parada do caminho do dia (uma aula num prédio). */
export interface RouteStop {
  index: number; // 0, 1, 2... (o número mostrado no marcador é index + 1)
  session: ClassSession;
  building: Building;
  status: 'past' | 'now' | 'upcoming';
}

/** Um trecho entre duas aulas consecutivas, com o intervalo de tempo em que a pessoa caminha. */
export interface RouteLeg {
  from: RouteStop;
  to: RouteStop;
  path: LatLng[];
  /** Janela livre entre o fim de uma aula e o início da próxima. */
  freeFrom: TimeOfDay;
  freeUntil: TimeOfDay;
  isNext: boolean; // o próximo trecho que a pessoa vai caminhar
  distanceMeters?: number;
  durationSeconds?: number;
}

export interface DayRoute {
  stops: RouteStop[];
  legs: RouteLeg[];
}

/**
 * Pontos intermediários opcionais para trechos específicos, para o caminho
 * contornar prédios. Chave: "idPredioOrigem>idPredioDestino". Sem entrada aqui,
 * o trecho usa a rota pré-carregada do OpenRouteService (se houver) ou cotovelo.
 */
const WAYPOINTS: Record<string, LatLng[]> = {
  // Exemplo: 'howey>skiles': [{ latitude: 33.7760, longitude: -84.3975 }],
};

function legPath(a: Building, b: Building): LatLng[] {
  const custom = WAYPOINTS[`${a.id}>${b.id}`];
  if (custom) return [a.coordinate, ...custom, b.coordinate];
  const cached = (preloadedCampusCache as Record<string, LatLng[]>)[`${a.id}>${b.id}`];
  if (cached && cached.length > 0) return cached;
  const elbow = { latitude: a.coordinate.latitude, longitude: b.coordinate.longitude };
  return [a.coordinate, elbow, b.coordinate];
}

/** Monta as paradas e trechos de um dia a partir de uma lista de aulas. */
export function buildDayRoute(classes: ClassSession[], now: TimeOfDay): DayRoute {
  const nowMin = toMinutes(now);
  const sorted = sortByStart(classes);

  const stops: RouteStop[] = sorted.map((session, index) => {
    const start = toMinutes(session.start);
    const end = toMinutes(session.end);
    const status = nowMin >= end ? 'past' : nowMin >= start ? 'now' : 'upcoming';
    return { index, session, building: getBuilding(session.buildingId), status };
  });

  // O próximo trecho é o que termina na primeira aula que ainda não começou.
  const nextStopIndex = stops.findIndex((s) => s.status === 'upcoming');

  const legs: RouteLeg[] = stops.slice(1).map((to, i) => {
    const from = stops[i];
    return {
      from,
      to,
      path: legPath(from.building, to.building),
      freeFrom: from.session.end,
      freeUntil: to.session.start,
      isNext: to.index === nextStopIndex,
    };
  });

  return { stops, legs };
}

/** ~11 m em graus — um "passo" de deslocamento entre linhas paralelas de pessoas diferentes. */
const OFFSET_STEP_DEG = 0.0001;

/**
 * Desloca um ponto alguns metros (diagonal) para desenhar caminhos de pessoas
 * diferentes lado a lado em vez de um em cima do outro. `steps` pode ser negativo.
 */
export function shiftCoordinate(p: LatLng, steps: number): LatLng {
  if (!steps) return p;
  return {
    latitude: p.latitude + steps * OFFSET_STEP_DEG,
    longitude: p.longitude + steps * OFFSET_STEP_DEG * 1.2, // compensa a longitude "mais curta" nesta latitude
  };
}

/** Região do mapa que enquadra todas as coordenadas, com uma margem. */
export function regionFor(points: LatLng[], padding = 1.6) {
  // Sem pontos (ex.: dia sem aulas), Math.min() daria Infinity → região inválida → o mapa abria nos EUA inteiros.
  if (!points.length) return { latitude: 33.7762, longitude: -84.398, latitudeDelta: 0.0115, longitudeDelta: 0.017 };
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * padding, 0.004),
    longitudeDelta: Math.max((maxLng - minLng) * padding, 0.004),
  };
}
