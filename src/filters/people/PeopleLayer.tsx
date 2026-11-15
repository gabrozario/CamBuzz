import { useMemo } from 'react';
import { DayRouteLayer } from '../../components/map/DayRouteLayer';
import { useMapViewport } from '../../components/map/mapViewport';
import { useAppTheme } from '../../theme';
import { remainingRoute, shiftCoordinate } from '../../utils/route';
import { estimateCalloutWidth, placeCallouts } from './calloutPlacement';
import { sharedBuildings } from './peopleDay';
import { CALLOUT_HEIGHT, SharedBuildingCallout } from './SharedBuildingCallout';
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
  const { colors } = useAppTheme();
  const shared = useMemo(() => (single ? [] : sharedBuildings(days, colors.ink)), [days, single, colors.ink]);
  const offsetOf = (i: number) => i - (days.length - 1) / 2;

  // Cada card vai para o lugar livre mais perto do prédio (sem cobrir bolinhas nem outros cards),
  // recalculado a cada zoom/movimento do mapa.
  const { viewport, width, height } = useMapViewport();
  const positions = useMemo(() => {
    if (!shared.length) return {};
    const circles = days.flatMap((day, i) =>
      remainingRoute(day.route).stops.map((s) => ({
        coordinate: shiftCoordinate(s.building.coordinate, offsetOf(i)),
        radius: s.status === 'now' ? 23 : 15, // anel da aula de agora / bolinha
      })),
    );
    const boxes = shared.map((s) => ({
      key: s.building.id,
      coordinate: s.building.coordinate,
      width: estimateCalloutWidth(s.building.shortName, s.line),
      height: CALLOUT_HEIGHT,
    }));
    return placeCallouts(boxes, circles, viewport, width, height);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shared, days, viewport, width, height]);

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
          offset={offsetOf(i)}
          isMe={day.person.isMe}
        />
      ))}
      {shared.map((s) => (
        <SharedBuildingCallout key={s.building.id} shared={s} position={positions[s.building.id] ?? s.building.coordinate} />
      ))}
    </>
  );
}
