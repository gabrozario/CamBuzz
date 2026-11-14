import type { CampusEvent, Person, TimeOfDay } from '../../types';
import type { DayRoute } from '../../utils/route';
import { toMinutes } from '../../utils/time';
import { findEventsOnRoute, MIN_MINUTES_AT_EVENT, type EventMatch } from './eventsOnRoute';

/** Alguém (amigo) cujo dia é considerado para "ir junto". */
export interface Companion {
  person: Person;
  route: DayRoute;
}

/** Um amigo que também pode ir ao evento, e por quanto tempo vocês coincidem lá. */
export interface FriendAtEvent {
  person: Person;
  minutesTogether: number;
  from: TimeOfDay;
  until: TimeOfDay;
}

function toTime(min: number): TimeOfDay {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

/** Intervalo em que alguém poderia estar no evento: dentro da janela livre, do evento e depois de "agora". */
function presence(m: EventMatch, now: TimeOfDay): [number, number] {
  const start = Math.max(toMinutes(m.window.start), toMinutes(m.event.start), toMinutes(now));
  const end = Math.min(toMinutes(m.window.end), toMinutes(m.event.end));
  return [start, end];
}

/**
 * Para cada evento do SEU caminho, quais amigos também podem ir.
 * Um amigo conta se o evento também cabe no caminho dele (mesma regra dos eventos)
 * e se vocês dois estariam livres lá ao mesmo tempo por pelo menos MIN_MINUTES_AT_EVENT.
 * (Aproximação: não desconta a caminhada do intervalo em comum.)
 */
export function friendsAtEvents(
  myMatches: EventMatch[],
  companions: Companion[],
  events: CampusEvent[],
  now: TimeOfDay,
): Map<string, FriendAtEvent[]> {
  const result = new Map<string, FriendAtEvent[]>();
  if (!companions.length) return result;

  const friendMatches = companions.map((c) => ({
    person: c.person,
    byEvent: new Map(findEventsOnRoute(c.route, events, now).map((m) => [m.event.id, m])),
  }));

  for (const mine of myMatches) {
    const [myStart, myEnd] = presence(mine, now);
    const list: FriendAtEvent[] = [];
    for (const f of friendMatches) {
      const theirs = f.byEvent.get(mine.event.id);
      if (!theirs) continue;
      const [theirStart, theirEnd] = presence(theirs, now);
      const from = Math.max(myStart, theirStart);
      const until = Math.min(myEnd, theirEnd);
      if (until - from >= MIN_MINUTES_AT_EVENT) {
        list.push({ person: f.person, minutesTogether: until - from, from: toTime(from), until: toTime(until) });
      }
    }
    if (list.length) result.set(mine.event.id, list);
  }
  return result;
}

/** Ex.: "Maya can go too", "Maya & Priya can go too", "Maya, Priya & Sam can go too" */
export function friendsLabel(list: FriendAtEvent[]): string {
  const names = list.map((f) => f.person.shortName);
  const joined = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
  return `${joined} can go too`;
}
