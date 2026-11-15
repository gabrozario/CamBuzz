import { MapPin } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { fonts, radius, shadow, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import type { LatLng } from '../../types';
import { useTracksViewChanges } from './useTracksViewChanges';

interface Props {
  coordinate: LatLng;
  label: string;
  color?: string;
  /** Tocar no pino tira o destaque. */
  onPress: () => void;
}

/**
 * Alfinete de destaque de um resultado da busca que não tem filtro próprio
 * (prédio, sua aula, onde um amigo está agora): ícone + nome em cima.
 */
export function SearchPin({ coordinate, label, color, onPress }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const fill = color ?? colors.ink;
  const tracks = useTracksViewChanges([label, fill]);
  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={tracks} zIndex={55} onPress={onPress}>
      <View style={styles.box}>
        <View style={styles.chip}>
          <Text style={styles.chipText} numberOfLines={1}>
            {label}
          </Text>
        </View>
        <MapPin size={34} color={colors.surface} fill={fill} strokeWidth={1.6} />
      </View>
    </Marker>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    box: { alignItems: 'center', paddingHorizontal: 6, paddingTop: 6 },
    chip: {
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 2,
      maxWidth: 240,
      ...shadow,
    },
    chipText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  });
