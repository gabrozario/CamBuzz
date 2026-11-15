import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { fonts, shadow, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import type { LatLng } from '../../types';
import { useTracksViewChanges } from './useTracksViewChanges';

interface Props {
  coordinate: LatLng;
  count: number;
  /** Cor do grupo (ex.: cor da categoria). Padrão: ink. */
  color?: string;
  onPress: () => void;
}

const SIZE = 36;

/**
 * Pino de GRUPO: vários pinos colados no zoom atual viram um círculo com o número ("12").
 * Tocar dá zoom na área e os pinos se separam.
 */
export function ClusterPin({ coordinate, count, color, onPress }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const fill = color ?? colors.ink;
  const tracks = useTracksViewChanges([count, fill]);
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracks}
      zIndex={25}
      onPress={onPress}
    >
      {/* A "foto" do marcador é do tamanho do círculo: a área de toque bate com o que se vê. */}
      <View style={styles.box}>
        <View style={[styles.ring, { borderColor: fill }]} />
        <View style={[styles.circle, { backgroundColor: fill }]}>
          <Text style={[styles.count, fill === colors.ink && { color: colors.onInk }]}>{count}</Text>
        </View>
      </View>
    </Marker>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    box: { width: SIZE + 8, height: SIZE + 8, alignItems: 'center', justifyContent: 'center' },
    ring: {
      position: 'absolute',
      width: SIZE + 8,
      height: SIZE + 8,
      borderRadius: (SIZE + 8) / 2,
      borderWidth: 3,
      opacity: 0.3,
    },
    circle: {
      width: SIZE,
      height: SIZE,
      borderRadius: SIZE / 2,
      borderWidth: 2,
      borderColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow,
    },
    count: { fontFamily: fonts.bold, fontSize: 14, color: colors.white },
  });
