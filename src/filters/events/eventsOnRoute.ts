import type { CampusEvent, LatLng, TimeOfDay } from '../../types';
import { nearestPointOnPath, pathLengthMeters, walkMinutes } from '../../utils/geo';
import type { DayRoute, RouteStop } from '../../utils/route';
import { formatTime, toMinutes } from '../../utils/time';

// ---- Parâmetros da regra "dá pra ir?" (ajuste aqui) ----
/** Distância máxima (m) entre o evento e o seu caminho para contar como "perto". */
export const NEAR_ROUTE_METERS = 300;
/** Tempo mínimo (min) que você precisa conseguir ficar no evento. */
export const MIN_MINUTES_AT_EVENT = 10;
/** Depois da última aula, por quantos minutos ainda procuramos eventos perto dela. */
const AFTER_LAST_CLASS_MINUTES = 150;

/**
 * Uma "janela livre" do dia: o tempo entre duas aulas (você está caminhando de
 * um prédio a outro) ou depois da última aula.
 */
export interface FreeWindow {
  id: string;
  kind: 'between' | 'after';
  from: RouteStop; // aula que acabou
  to?: RouteStop; // próxima aula (ausente em 'after')
  start: TimeOfDay;
  end: TimeOfDay;
  path: LatLng[]; // por onde você passa nessa janela
}

/** Um evento que cabe no seu dia. */
export interface EventMatch {
  event: CampusEvent;
  window: FreeWindow;
  /** Distância (m) do evento até o ponto mais próximo do seu caminho. */
  distanceMeters: number;
  /** Ponto do seu caminho de onde você sairia para ir ao evento. */
  pathPoint: LatLng;
  /** Minutos extras de caminhada (ida e volta do caminho até o evento). */
  detourMinutes: number;
  /** Quanto tempo dá para ficar no evento sem se atrasar para a próxima aula. */
  minutesAtEvent: number;
}

function addMinutes(time: TimeOfDay, minutes: number): TimeOfDay {
  const total = Math.min(toMinutes(time) + minutes, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Monta as janelas livres a partir do caminho do dia. */
export function freeWindows(route: DayRoute): FreeWindow[] {
  const windows: FreeWindow[] = route.legs.map((leg) => ({
    id: `between-${leg.from.session.id}-${leg.to.session.id}`,
    kind: 'between',
    from: leg.from,
    to: leg.to,
    start: leg.freeFrom,
    end: leg.freeUntil,
    path: leg.path,
  }));

  const last = route.stops[route.stops.length - 1];
  if (last) {
    windows.push({
      id: `after-${last.session.id}`,
      kind: 'after',
      from: last,
      start: last.session.end,
      end: addMinutes(last.session.end, AFTER_LAST_CLASS_MINUTES),
      path: [last.building.coordinate],
    });
  }
  return windows;
}

/** Avalia se um evento cabe numa janela. Retorna null se não cabe. */
function matchInWindow(event: CampusEvent, window: FreeWindow, now: TimeOfDay): EventMatch | null {
  const nearest = nearestPointOnPath(event.coordinate, window.path);
  if (nearest.distance > NEAR_ROUTE_METERS) return null;

  // Parte da janela que ainda não passou e em que o evento está acontecendo.
  const overlapStart = Math.max(toMinutes(window.start), toMinutes(event.start), toMinutes(now));
  const overlapEnd = Math.min(toMinutes(window.end), toMinutes(event.end));
  const overlap = overlapEnd - overlapStart;
  if (overlap <= 0) return null;

  // Tempo livre de verdade = janela − caminhada até a próxima aula − desvio até o evento.
  const detourMinutes = walkMinutes(2 * nearest.distance);
  const legWalk = walkMinutes(pathLengthMeters(window.path));
  const windowLeft = toMinutes(window.end) - Math.max(toMinutes(window.start), toMinutes(now));
  const minutesAtEvent = Math.min(overlap, windowLeft - legWalk - detourMinutes);
  if (minutesAtEvent < MIN_MINUTES_AT_EVENT) return null;

  return {
    event,
    window,
    distanceMeters: Math.round(nearest.distance),
    pathPoint: nearest.point,
    detourMinutes,
    minutesAtEvent,
  };
}

/**
 * Eventos que ficam perto do seu caminho E acontecem enquanto você passa por lá.
 * Se um evento cabe em mais de uma janela, fica a que dá mais tempo no evento.
 */
export function findEventsOnRoute(route: DayRoute, events: CampusEvent[], now: TimeOfDay): EventMatch[] {
  const windows = freeWindows(route);
  const matches: EventMatch[] = [];

  for (const event of events) {
    let best: EventMatch | null = null;
    for (const window of windows) {
      const m = matchInWindow(event, window, now);
      if (m && (!best || m.minutesAtEvent > best.minutesAtEvent)) best = m;
    }
    if (best) matches.push(best);
  }
  return matches;
}

/** Título da janela, ex.: "Between CS 1332 and CS 2110" */
export function windowTitle(w: FreeWindow): string {
  return w.kind === 'after' ? 'After your last class' : `Between ${w.from.session.course} and ${w.to!.session.course}`;
}

/** Subtítulo da janela, ex.: "12:15 PM – 2:00 PM · Clough Commons → Klaus" */
export function windowSubtitle(w: FreeWindow): string {
  if (w.kind === 'after') return `From ${formatTime(w.start)} · near ${w.from.building.shortName}`;
  return `${formatTime(w.start)} – ${formatTime(w.end)} · ${w.from.building.shortName} → ${w.to!.building.shortName}`;
}

/** Texto curto do desvio, ex.: "On your way" ou "4 min detour" */
export function detourLabel(m: EventMatch): string {
  return m.detourMinutes <= 1 ? 'On your way' : `${m.detourMinutes} min detour`;
}
