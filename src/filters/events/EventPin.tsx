import { Marker } from 'react-native-maps';
import { PinNameMarker } from '../../components/map/PinNameMarker';
import { PlacePin } from '../../components/map/PlacePin';
import { useTracksViewChanges } from '../../components/map/useTracksViewChanges';
import { useAppTheme } from '../../theme';
import { eventMapLabel } from './eventLabel';
import type { EventEntry } from './useEventsFilter';

interface Props {
  entry: EventEntry;
  selected?: boolean;
  /** Mostrar o nome embaixo do alfinete (só com zoom, como os nomes do Google/Apple Maps). */
  showLabel?: boolean;
  onPress: () => void;
}


/**
 * Alfinete numerado de um evento (escuro, como no Figma). Selecionado = maior, com o nome em cima.
 * O marcador TOCÁVEL é só o alfinete, sempre do mesmo tamanho (como as impressoras, que clicam
 * perfeitamente no iPhone). O nome com zoom vai num marcador separado e não tocável (PinNameMarker).
 */
export function EventPin({ entry, selected = false, showLabel = false, onPress }: Props) {
  const { colors } = useAppTheme();
  const friendDots = entry.friends.slice(0, 3).map((f) => ({ id: f.person.id, color: f.person.color }));
  const tracks = useTracksViewChanges([selected, entry.number, !!entry.dim, friendDots.map((d) => d.id).join()]);
  // Apagado: fora do seu caminho (dia com agenda) ou já terminou.
  const offRoute = !!entry.dim;
  // Nome com zoom: marcador separado, embaixo do alfinete.
  const withLabel = showLabel && !selected;

  return (
    <>
      {/* anchor → a PONTA do alfinete fica no local do evento */}
      <Marker
        coordinate={entry.event.coordinate}
        anchor={{ x: 0.5, y: 1 }}
        tracksViewChanges={tracks}
        zIndex={selected ? 30 : 20}
        onPress={onPress}
      >
        <PlacePin
          label={String(entry.number)}
          color={offRoute ? colors.muted : colors.ink}
          textColor={offRoute ? colors.white : colors.onInk}
          selected={selected}
          dots={friendDots}
        />
      </Marker>

      {withLabel && <PinNameMarker coordinate={entry.event.coordinate} text={eventMapLabel(entry.event)} />}

      {/* Balão com o nome do lugar aberto: EMBAIXO do alfinete, no mesmo lugar do nome. */}
      {selected && <PinNameMarker coordinate={entry.event.coordinate} text={entry.event.name} variant="bubble" selected />}
    </>
  );
}
