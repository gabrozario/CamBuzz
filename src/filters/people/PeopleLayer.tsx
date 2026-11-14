import { useMemo } from 'react';
import { DayRouteLayer } from '../../components/map/DayRouteLayer';
import { sharedBuildings } from './peopleDay';
import { SharedBuildingCallout } from './SharedBuildingCallout';
import type { PeopleFilterState } from './usePeopleFilter';

interface Props {
  state: PeopleFilterState;
}

/**
 * O que o filtro People desenha no mapa: o caminho de cada pessoa visível,
 * cada um na sua cor e levemente deslocado para não sobrepor.
 * - 1 pessoa: marcadores com chip de horário (Figma "People · Maya").
 * - 2+ pessoas: só os círculos + um card por prédio compartilhado (Figma "People · You and Maya").
 */
export function PeopleLayer({ state }: Props) {
  const days = state.visibleDays;
  const single = days.length === 1;
  const shared = useMemo(() => (single ? [] : sharedBuildings(days)), [days, single]);

  return (
    <>
      {days.map((day, i) => (
        <DayRouteLayer
          key={day.person.id}
          route={day.route}
          color={day.person.color}
          highlightNextLeg
          nextLegColor={day.person.color}
          showChips={single}
          offset={i - (days.length - 1) / 2}
        />
      ))}
      {shared.map((s) => (
        <SharedBuildingCallout key={s.building.id} shared={s} />
      ))}
    </>
  );
}
