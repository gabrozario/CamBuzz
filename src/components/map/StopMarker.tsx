import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { colors, fonts, radius, shadow } from '../../theme';
import type { RouteStop } from '../../utils/route';
import { formatTimeShort } from '../../utils/time';
import { useTracksViewChanges } from './useTracksViewChanges';

interface Props {
  stop: RouteStop;
  color: string; // cor da pessoa (verde = você)
}

/** Marcador numerado de uma aula + chip com horário embaixo. */
export function StopMarker({ stop, color }: Props) {
  const tracks = useTracksViewChanges();
  const isNow = stop.status === 'now';
  const isPast = stop.status === 'past';
  const label = isNow
    ? `Now · ${stop.building.shortName}`
    : `${formatTimeShort(stop.session.start)} · ${stop.building.shortName}`;

  return (
    <>
      {/* Círculo numerado (com "anel" se for a aula de agora) */}
      <Marker
        coordinate={stop.building.coordinate}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={tracks}
        zIndex={10}
        title={`${stop.session.course} · ${stop.session.kind}`}
        description={`${stop.building.name}${stop.session.room ? ` · ${stop.session.room}` : ''}`}
      >
        <View style={styles.markerBox}>
          {isNow && <View style={[styles.ring, { backgroundColor: color }]} />}
          <View style={[styles.circle, { backgroundColor: color }, isPast && styles.past]}>
            {isNow ? <View style={styles.nowDot} /> : <Text style={styles.number}>{stop.index + 1}</Text>}
          </View>
        </View>
      </Marker>

      {/* Chip com horário/prédio, ancorado logo abaixo do círculo */}
      <Marker
        coordinate={stop.building.coordinate}
        anchor={{ x: 0.5, y: 0 }}
        tracksViewChanges={tracks}
        zIndex={9}
        tappable={false}
      >
        <View style={styles.chipBox}>
          <View style={[styles.chip, isPast && styles.past]}>
            <Text style={[styles.chipText, isNow && { color }]} numberOfLines={1}>
              {label}
            </Text>
          </View>
        </View>
      </Marker>
    </>
  );
}

const CIRCLE = 26;
const RING = 46;

const styles = StyleSheet.create({
  markerBox: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, opacity: 0.25 },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { fontFamily: fonts.semibold, fontSize: 12, color: colors.white },
  nowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  past: { opacity: 0.55 },
  // paddingTop afasta o chip do círculo; padding lateral dá espaço para a sombra.
  chipBox: { paddingTop: 22, paddingHorizontal: 6, paddingBottom: 6 },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    ...shadow,
  },
  chipText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.ink },
});
