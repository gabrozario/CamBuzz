import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { useTracksViewChanges } from '../../components/map/useTracksViewChanges';
import { fonts, radius, shadow, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import type { ResourceLocation } from '../../types';

interface Props {
  /** Qualquer local com código e coordenada (também usado pelo filtro Food options). */
  location: Pick<ResourceLocation, 'id' | 'code' | 'name' | 'coordinate'>;
  color: string;
  selected?: boolean;
  onPress: () => void;
}

const CIRCLE = 30;
const HALO = 68;
const SMALL = CIRCLE + 6;

/** Pino circular de recurso no campus (L1, P1, R1...). Selecionado = com halo e chip de nome. */
export function ResourcePin({ location, color, selected = false, onPress }: Props) {
  const styles = useThemedStyles(makeStyles);
  const tracks = useTracksViewChanges([selected, location.id, location.code, color]);

  return (
    <>
      <Marker
        coordinate={location.coordinate}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={tracks}
        zIndex={selected ? 30 : 20}
        onPress={onPress}
      >
        {/* Área de toque = tamanho do círculo; só cresce (halo) quando selecionado. */}
        <View style={[styles.box, { width: selected ? HALO : SMALL, height: selected ? HALO : SMALL }]}>
          {selected && <View style={[styles.halo, { backgroundColor: color }]} />}
          <View style={[styles.circle, { backgroundColor: color }]}>
            <Text style={styles.code}>{location.code}</Text>
          </View>
        </View>
      </Marker>

      {selected && (
        <Marker
          coordinate={location.coordinate}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={tracks}
          // Abaixo do pino (30): no Android "tappable" não funciona e o chip roubaria o toque do pino.
          zIndex={29}
          tappable={false}
        >
          <View style={styles.chipBox}>
            <View style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>
                {location.name}
              </Text>
            </View>
          </View>
        </Marker>
      )}
    </>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    width: HALO,
    height: HALO,
    borderRadius: HALO / 2,
    opacity: 0.2,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  code: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
    textAlign: 'center',
  },
  chipBox: { paddingBottom: HALO / 2 + 2, paddingHorizontal: 6, paddingTop: 6 },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: 240,
    ...shadow,
  },
  chipText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
});
