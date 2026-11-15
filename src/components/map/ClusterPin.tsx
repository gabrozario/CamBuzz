import { Marker } from 'react-native-maps';
import { useAppTheme } from '../../theme';
import type { LatLng } from '../../types';
import { PlacePin } from './PlacePin';
import { useTracksViewChanges } from './useTracksViewChanges';

interface Props {
  coordinate: LatLng;
  count: number;
  /** Cor do grupo (ex.: cor da categoria). Padrão: ink. */
  color?: string;
  onPress: () => void;
}

/**
 * Alfinete de GRUPO: vários lugares colados no zoom atual viram um alfinete com o número ("12").
 * Tocar dá zoom na área e os alfinetes se separam.
 */
export function ClusterPin({ coordinate, count, color, onPress }: Props) {
  const { colors } = useAppTheme();
  const fill = color ?? colors.ink;
  const tracks = useTracksViewChanges([count, fill]);
  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={tracks} zIndex={25} onPress={onPress}>
      <PlacePin
        label={String(count)}
        color={fill}
        size="large"
      />
    </Marker>
  );
}
