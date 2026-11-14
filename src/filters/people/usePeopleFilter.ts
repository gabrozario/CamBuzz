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

  // Amigo recém-adicionado (pelo popup) já aparece selecionado.
  const knownIds = useRef(new Set(friends.map((f) => f.id)));
  useEffect(() => {
    const added = friends.filter((f) => !knownIds.current.has(f.id));
    friends.forEach((f) => knownIds.current.add(f.id));
    if (added.length) setVisibleIds((prev) => new Set([...prev, ...added.map((f) => f.id)]));
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
