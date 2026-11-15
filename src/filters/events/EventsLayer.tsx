import { useMemo } from 'react';
import { Polyline } from 'react-native-maps';
import { ClusterPin } from '../../components/map/ClusterPin';
import { useMapViewport } from '../../components/map/mapViewport';
import { clusterOnScreen } from '../../utils/cluster';
import { useAppTheme } from '../../theme';
import { EventPin } from './EventPin';
import type { EventsFilterState } from './useEventsFilter';

interface Props {
  state: EventsFilterState;
}

/**
 * O que o filtro de Eventos desenha no mapa (vai dentro do <CampusMap>).
 * - Lista: um pino numerado por evento.
 * - Detalhe: só o evento escolhido, com halo, nome e uma linha tracejada
 *   mostrando o desvio a partir do seu caminho.
 */
export function EventsLayer({ state }: Props) {
  const { entries, selected, select } = state;
  const { colors } = useAppTheme();
  const { viewport, width, height, zoomTo } = useMapViewport();
  // Eventos colados no zoom atual viram um grupo "3" (tocar dá zoom e separa).
  const clusters = useMemo(
    () => clusterOnScreen(entries, (e) => e.event.coordinate, (e) => e.event.id, viewport, width, height),
    [entries, viewport, width, height],
  );

  if (selected) {
    return (
      <>
        {selected.match && selected.match.distanceMeters > 15 && (
          <Polyline
            coordinates={[selected.match.pathPoint, selected.event.coordinate]}
            strokeColor={colors.ink}
            strokeWidth={3}
            lineDashPattern={[8, 8]}
            zIndex={3}
          />
        )}
        <EventPin key={`sel-${selected.event.id}`} entry={selected} selected onPress={() => {}} />
      </>
    );
  }

  return (
    <>
      {clusters.map((c) =>
        c.items.length === 1 ? (
          <EventPin key={c.key} entry={c.items[0]} onPress={() => select(c.items[0].event.id)} />
        ) : (
          <ClusterPin
            key={c.key}
            coordinate={c.coordinate}
            count={c.items.length}
            onPress={() => zoomTo(c.items.map((e) => e.event.coordinate))}
          />
        ),
      )}
    </>
  );
}
