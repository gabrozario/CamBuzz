import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { useTracksViewChanges } from '../../components/map/useTracksViewChanges';
import { colors, fonts, radius, shadow } from '../../theme';
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

/** Pino circular de recurso no campus (L1, P1, R1...). Selecionado = com halo e chip de nome. */
export function ResourcePin({ location, color, selected = false, onPress }: Props) {
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
        <View style={styles.box}>
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
          zIndex={31}
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

const styles = StyleSheet.create({
  box: { width: HALO, height: HALO, alignItems: 'center', justifyContent: 'center' },
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
    borderColor: colors.white,
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
