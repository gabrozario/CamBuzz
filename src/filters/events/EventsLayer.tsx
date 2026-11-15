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

/** Zoom a partir do qual o nome dos eventos aparece (latitudeDelta menor = mais perto). */
const LABEL_ZOOM_DELTA = 0.0055;

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
  // Nomes aparecem com zoom (como no Google/Apple Maps) e somem ao afastar.
  const showLabels = !!viewport && viewport.latitudeDelta <= LABEL_ZOOM_DELTA;
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
          <EventPin key={c.key} entry={c.items[0]} showLabel={showLabels} onPress={() => select(c.items[0].event.id)} />
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
