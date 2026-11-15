import { useCallback, useMemo, useState } from 'react';
import { events as allEvents } from '../../../data';
import type { CampusEvent, TimeOfDay } from '../../types';
import type { DayRoute } from '../../utils/route';
import { toMinutes } from '../../utils/time';
import { findEventsOnRoute, windowSubtitle, windowTitle, type EventMatch } from './eventsOnRoute';
import { friendsAtEvents, type Companion, type FriendAtEvent } from './eventsWithFriends';

/** Um evento como aparece na lista e no mapa. */
export interface EventEntry {
  event: CampusEvent;
  /** Número do pino no mapa e na lista (1, 2, 3...). */
  number: number;
  /** Presente se o evento cabe no seu caminho. */
  match?: EventMatch;
  /** Amigos (visíveis no filtro People) que também podem ir. Vazio se People estiver desligado. */
  friends: FriendAtEvent[];
}

export interface EventSection {
  id: string;
  title: string;
  subtitle?: string;
  entries: EventEntry[];
}

const byStart = (a: CampusEvent, b: CampusEvent) => toMinutes(a.start) - toMinutes(b.start);

/**
 * Estado do filtro de Eventos: quais eventos mostrar, em que seções e qual está
 * selecionado. Usado pelo MapScreen para alimentar EventsLayer (mapa) e EventsSheet (aba).
 *
 * `companions`: amigos visíveis no filtro People (passe [] se People estiver desligado).
 * Com eles, cada evento ganha a lista de amigos que podem ir junto.
 */
export function useEventsFilter(route: DayRoute, now: TimeOfDay, companions: Companion[] = []) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const matches = useMemo(() => findEventsOnRoute(route, allEvents, now), [route, now]);
  const withFriends = useMemo(
    () => friendsAtEvents(matches, companions, allEvents, now),
    [matches, companions, now],
  );

  const { sections, entries, upcomingCount } = useMemo(() => {
    const matchById = new Map(matches.map((m) => [m.event.id, m]));
    // Eventos que ainda não acabaram.
    const upcoming = allEvents.filter((e) => toMinutes(e.end) > toMinutes(now)).sort(byStart);

    // Uma seção por janela livre (em ordem do dia), com os eventos que cabem nela.
    const windowSections = new Map<string, EventSection & { start: number }>();
    for (const m of [...matches].sort((a, b) => byStart(a.event, b.event))) {
      const w = m.window;
      if (!windowSections.has(w.id)) {
        windowSections.set(w.id, {
          id: w.id,
          title: windowTitle(w),
          subtitle: windowSubtitle(w),
          entries: [],
          start: toMinutes(w.start),
        });
      }
      windowSections
        .get(w.id)!
        .entries.push({ event: m.event, number: 0, match: m, friends: withFriends.get(m.event.id) ?? [] });
    }
    const result: EventSection[] = [...windowSections.values()].sort((a, b) => a.start - b.start);

    if (showAll) {
      const others = upcoming.filter((e) => !matchById.has(e.id));
      if (others.length) {
        result.push({
          id: 'others',
          title: 'Other events today',
          subtitle: 'Not on your route',
          entries: others.map((event) => ({ event, number: 0, friends: [] })),
        });
      }
    }

    // Numera na ordem em que aparecem na lista — é o mesmo número do pino no mapa.
    let n = 1;
    for (const s of result) for (const e of s.entries) e.number = n++;

    return { sections: result, entries: result.flatMap((s) => s.entries), upcomingCount: upcoming.length };
  }, [matches, withFriends, now, showAll]);

  const withFriendsCount = withFriends.size;

  const selected = entries.find((e) => e.event.id === selectedId) ?? null;
  const clearSelection = useCallback(() => setSelectedId(null), []);
  /** Volta ao início (nenhum evento aberto, "Show all" desligado) — chamado ao desligar o filtro. */
  const reset = useCallback(() => {
    setSelectedId(null);
    setShowAll(false);
  }, []);

  return {
    sections,
    entries,
    matchCount: matches.length,
    /** Quantos eventos do seu caminho têm pelo menos um amigo que pode ir junto. */
    withFriendsCount,
    hasCompanions: companions.length > 0,
    upcomingCount,
    selected,
    select: setSelectedId,
    clearSelection,
    reset,
    showAll,
    setShowAll,
  };
}

export type EventsFilterState = ReturnType<typeof useEventsFilter>;
