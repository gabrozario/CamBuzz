import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { useTracksViewChanges } from '../../components/map/useTracksViewChanges';
import { colors, fonts, radius, shadow } from '../../theme';
import type { EventEntry } from './useEventsFilter';

interface Props {
  entry: EventEntry;
  selected?: boolean;
  onPress: () => void;
}

/** Pino numerado de um evento (círculo escuro, como no Figma). Selecionado = com halo e nome. */
export function EventPin({ entry, selected = false, onPress }: Props) {
  const tracks = useTracksViewChanges([selected, entry.number, !!entry.match]);
  const offRoute = !entry.match;

  return (
    <>
      <Marker
        coordinate={entry.event.coordinate}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={tracks}
        zIndex={selected ? 30 : 20}
        onPress={onPress}
      >
        <View style={styles.box}>
          {selected && <View style={styles.halo} />}
          <View style={[styles.circle, offRoute && styles.offRoute]}>
            <Text style={styles.number}>{entry.number}</Text>
          </View>
        </View>
      </Marker>

      {selected && (
        // Chip com o nome, acima do pino (anchor y: 1 = a base do chip fica no ponto).
        <Marker
          coordinate={entry.event.coordinate}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={tracks}
          zIndex={31}
          tappable={false}
        >
          <View style={styles.chipBox}>
            <View style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>
                {entry.event.name}
              </Text>
            </View>
          </View>
        </Marker>
      )}
    </>
  );
}

const CIRCLE = 30;
const HALO = 72;

const styles = StyleSheet.create({
  box: { width: HALO, height: HALO, alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    width: HALO,
    height: HALO,
    borderRadius: HALO / 2,
    backgroundColor: colors.ink,
    opacity: 0.14,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: colors.ink,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offRoute: { backgroundColor: colors.muted },
  number: { fontFamily: fonts.semibold, fontSize: 13, color: colors.white },
  // paddingBottom afasta o chip do halo; padding lateral dá espaço para a sombra.
  chipBox: { paddingBottom: HALO / 2 + 4, paddingHorizontal: 6, paddingTop: 6 },
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
