import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { schedule } from '../../../data';
import { useFriends } from '../../services/friends/FriendsProvider';
import type { TimeOfDay } from '../../types';
import { buildPersonDay, personFromFriend, personFromMe, type PersonDay } from './peopleDay';

/**
 * Estado do filtro People: o dia de cada pessoa (você + amigos) e quem está
 * visível no mapa. Começa só com "You" visível, como no Figma.
 */
export function usePeopleFilter(now: TimeOfDay) {
  const { friends } = useFriends();
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set(['me']));

  const days: PersonDay[] = useMemo(
    () => [personFromMe(schedule.classes), ...friends.map(personFromFriend)].map((p) => buildPersonDay(p, now)),
    [friends, now],
  );

  // Amigo recém-adicionado (pelo popup) já aparece selecionado; amigo removido sai da seleção.
  const knownIds = useRef(new Set(friends.map((f) => f.id)));
  useEffect(() => {
    const currentIds = new Set(friends.map((f) => f.id));
    const added = friends.filter((f) => !knownIds.current.has(f.id)).map((f) => f.id);
    knownIds.current = currentIds;
    setVisibleIds((prev) => {
      const next = new Set([...prev].filter((id) => id === 'me' || currentIds.has(id)));
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

  const visibleDays = useMemo(() => days.filter((d) => visibleIds.has(d.person.id)), [days, visibleIds]);

  return { days, visibleDays, visibleIds, toggle };
}

export type PeopleFilterState = ReturnType<typeof usePeopleFilter>;
