import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFriends } from '../../services/friends/FriendsProvider';
import { enhanceDayRouteWithORS } from '../../services/routing/openRouteService';
import { friendSessionsOnDate } from '../../services/schedule/scheduleLogic';
import { useSchedule } from '../../services/schedule/ScheduleProvider';
import { useAppTheme } from '../../theme';
import type { TimeOfDay } from '../../types';
import { buildPersonDay, personFromFriend, personFromMe, type PersonDay } from './peopleDay';

/**
 * Estado do filtro People: o dia de cada pessoa (você + amigos) e quem está
 * visível no mapa. Começa só com "You" visível, como no Figma.
 * As rotas a pé entre aulas são calculadas via OpenRouteService (HeiGIT)
 * para refletir os caminhos e calçadas reais do campus da Georgia Tech.
 */
/** `showMe`: o seu caminho aparece junto (pílula "My Route" ligada). */
export function usePeopleFilter(now: TimeOfDay, showMe = false) {
  const { friends } = useFriends();
  const { todayClasses, friendEvents, today } = useSchedule();
  // Cores do tema: buzz do "You" e amigos um pouco mais claros no modo escuro.
  const { colors, vivid } = useAppTheme();
  // Amigos visíveis (começa sem nenhum). O seu caminho é controlado pelo My Route, não por aqui.
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set());

  // Você: agenda de hoje. Amigos: aulas deles + eventos que aceitaram (ex.: um convite seu).
  const baseDays: PersonDay[] = useMemo(
    () =>
      [
        personFromMe(todayClasses, colors.me),
        ...friends.map((f) =>
          personFromFriend({ ...f, color: vivid(f.color), schedule: friendSessionsOnDate(f, friendEvents[f.id] ?? [], today) }),
        ),
      ].map((p) => buildPersonDay(p, now)),
    [friends, friendEvents, todayClasses, today, now, colors.me, vivid],
  );

  const [days, setDays] = useState<PersonDay[]>(baseDays);

  // Enriquece as rotas de todas as pessoas com a API do OpenRouteService
  useEffect(() => {
    let isMounted = true;
    setDays(baseDays);

    async function loadRealisticRoutes() {
      const enhanced = await Promise.all(
        baseDays.map(async (day) => {
          try {
            const enhancedRoute = await enhanceDayRouteWithORS(day.route);
            return { ...day, route: enhancedRoute };
          } catch {
            return day;
          }
        }),
      );
      if (isMounted) {
        setDays(enhanced);
      }
    }

    loadRealisticRoutes();

    return () => {
      isMounted = false;
    };
  }, [baseDays]);

  // Amigo recém-adicionado (pelo popup) já aparece selecionado; amigo removido sai da seleção.
  const knownIds = useRef(new Set(friends.map((f) => f.id)));
  useEffect(() => {
    const currentIds = new Set(friends.map((f) => f.id));
    const added = friends.filter((f) => !knownIds.current.has(f.id)).map((f) => f.id);
    knownIds.current = currentIds;
    setVisibleIds((prev) => {
      const next = new Set([...prev].filter((id) => currentIds.has(id)));
      added.forEach((id) => next.add(id));
      return next.size === prev.size && [...next].every((id) => prev.has(id)) ? prev : next;
    });
  }, [friends]);

  const toggle = useCallback((id: string) => {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /** Deixa o caminho de alguém visível (busca por nome de amigo). */
  const show = useCallback((id: string) => {
    setVisibleIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  /** Volta ao início (nenhum amigo visível) — chamado ao desligar o filtro. */
  const reset = useCallback(() => setVisibleIds(new Set()), []);

  const visibleDays = useMemo(
    () => days.filter((d) => (d.person.isMe ? showMe : visibleIds.has(d.person.id))),
    [days, visibleIds, showMe],
  );

  return { days, visibleDays, visibleIds, toggle, reset, show };
}

export type PeopleFilterState = ReturnType<typeof usePeopleFilter>;
