import type { Building, Friend, Person, TimeOfDay } from '../../types';
import { buildDayRoute, type DayRoute, type RouteStop } from '../../utils/route';
import { formatTime, formatTimeShort } from '../../utils/time';
import { colors } from '../../theme';

/** O dia de uma pessoa já calculado: caminho + textos de status. */
export interface PersonDay {
  person: Person;
  route: DayRoute;
  /** Ex.: "Library now · Study session", "Free until 12:30 PM", "Done for today" */
  status: string;
  /** Ex.: "Next: Clough Commons · 11:30 AM" (ausente se acabou o dia) */
  next?: string;
}

export function personFromMe(schedule: Person['schedule']): Person {
  return { id: 'me', name: 'You', shortName: 'You', color: colors.green, isMe: true, schedule };
}

export function personFromFriend(f: Friend): Person {
  return {
    id: f.id,
    name: f.name,
    shortName: f.name.split(' ')[0],
    color: f.color,
    isMe: false,
    schedule: f.schedule,
  };
}

function activityLabel(stop: RouteStop): string {
  const s = stop.session;
  return s.kind === 'Study session' || s.kind === 'Event' ? s.title : `${s.course} ${s.kind.toLowerCase()}`;
}

/** Calcula caminho e textos de status de uma pessoa para o horário `now`. */
export function buildPersonDay(person: Person, now: TimeOfDay): PersonDay {
  const route = buildDayRoute(person.schedule, now);
  const current = route.stops.find((s) => s.status === 'now');
  const upcoming = route.stops.find((s) => s.status === 'upcoming');

  let status: string;
  if (current && person.isMe) status = `${current.building.shortName} now`;
  else if (current) status = `${current.building.shortName} now · ${activityLabel(current)}`;
  else if (!upcoming) status = route.stops.length ? 'Done for today' : 'No classes today';
  else if (route.stops[0] === upcoming) status = `First class at ${formatTime(upcoming.session.start)}`;
  else status = `Free until ${formatTime(upcoming.session.start)}`;

  if (person.isMe) status = `Your schedule · ${status}`;

  const next = upcoming ? `Next: ${upcoming.building.shortName} · ${formatTime(upcoming.session.start)}` : undefined;
  return { person, route, status, next };
}

/** Um prédio por onde passam 2+ pessoas visíveis (ou onde alguém está agora). */
export interface SharedBuilding {
  building: Building;
  /** Ex.: "You 12:30 · Maya 12:45" ou "You now · Maya 11:30 AM" */
  line: string;
  /** Cor do título: a de quem está lá agora (ou ink). */
  color: string;
}

/**
 * Prédios para os cards combinados do mapa (Figma "People · You and Maya").
 * Mostra só prédios compartilhados por 2+ pessoas ou onde alguém está agora,
 * para o mapa não ficar poluído.
 */
export function sharedBuildings(days: PersonDay[]): SharedBuilding[] {
  const byBuilding = new Map<string, { building: Building; parts: { day: PersonDay; stop: RouteStop }[] }>();
  for (const day of days) {
    for (const stop of day.route.stops) {
      if (stop.status === 'past') continue;
      const entry = byBuilding.get(stop.building.id) ?? { building: stop.building, parts: [] };
      entry.parts.push({ day, stop });
      byBuilding.set(stop.building.id, entry);
    }
  }

  const result: SharedBuilding[] = [];
  for (const { building, parts } of byBuilding.values()) {
    const peopleHere = new Set(parts.map((p) => p.day.person.id));
    const nowPart = parts.find((p) => p.stop.status === 'now');
    if (peopleHere.size < 2 && !nowPart) continue;
    const line = parts
      .map((p) => `${p.day.person.shortName} ${p.stop.status === 'now' ? 'now' : formatTimeShort(p.stop.session.start)}`)
      .join(' · ');
    result.push({ building, line, color: nowPart ? nowPart.day.person.color : colors.ink });
  }
  return result;
}
