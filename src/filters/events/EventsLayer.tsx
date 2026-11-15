import { Polyline } from 'react-native-maps';
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
      {entries.map((entry) => (
        <EventPin key={entry.event.id} entry={entry} onPress={() => select(entry.event.id)} />
      ))}
    </>
  );
}
