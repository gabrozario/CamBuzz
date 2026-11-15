import { Marker } from 'react-native-maps';
import { PinNameMarker } from '../../components/map/PinNameMarker';
import { PlacePin } from '../../components/map/PlacePin';
import { useTracksViewChanges } from '../../components/map/useTracksViewChanges';
import type { ResourceLocation } from '../../types';

interface Props {
  /** Qualquer local com código e coordenada (também usado pelo filtro Food options). */
  location: Pick<ResourceLocation, 'id' | 'code' | 'name' | 'coordinate'>;
  color: string;
  selected?: boolean;
  /** Nome embaixo do alfinete (só com zoom; ex.: restaurantes e bibliotecas). */
  label?: string;
  onPress: () => void;
}

/**
 * Alfinete de um recurso/comida no campus (L1, P1, C3...). Selecionado = maior, com o nome em cima.
 * O marcador TOCÁVEL é só o alfinete, sempre do mesmo tamanho (como as impressoras, que clicam
 * perfeitamente no iPhone). O nome com zoom vai num marcador separado e não tocável (PinNameMarker).
 */
export function ResourcePin({ location, color, selected = false, label, onPress }: Props) {
  const withLabel = !!label && !selected;
  const tracks = useTracksViewChanges([selected, location.id, location.code, color]);

  return (
    <>
      {/* anchor → a PONTA do alfinete fica no local */}
      <Marker
        coordinate={location.coordinate}
        anchor={{ x: 0.5, y: 1 }}
        tracksViewChanges={tracks}
        zIndex={selected ? 30 : 20}
        onPress={onPress}
      >
        <PlacePin label={location.code} color={color} selected={selected} />
      </Marker>

      {withLabel && <PinNameMarker coordinate={location.coordinate} text={label} />}

      {/* Balão com o nome do lugar aberto: EMBAIXO do alfinete, no mesmo lugar do nome. */}
      {selected && <PinNameMarker coordinate={location.coordinate} text={location.name} variant="bubble" selected />}
    </>
  );
}
