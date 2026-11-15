import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { fonts, radius, shadow, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import { shiftCoordinate, type RouteStop } from '../../utils/route';
import { formatTimeShort } from '../../utils/time';
import { useTracksViewChanges } from './useTracksViewChanges';

interface Props {
  stop: RouteStop;
  color: string; // cor da pessoa (verde = você)
  showChip?: boolean;
  /** Mesmo deslocamento do caminho da pessoa (ver DayRouteLayer). */
  offset?: number;
  /** Seu caminho: a parada "agora" vira o "você está aqui". */
  isMe?: boolean;
}

/** Marcador numerado de uma aula + chip com horário embaixo. */
export function StopMarker({ stop, color, showChip = true, offset = 0, isMe = false }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useAppTheme();
  const tracks = useTracksViewChanges([color, showChip]);
  const isNow = stop.status === 'now';
  // "Você está aqui": azul vivo próprio e por cima de todos os pinos.
  const isHere = isNow && isMe;
  const dotColor = isHere ? colors.myLocation : color;
  const isPast = stop.status === 'past';
  const coordinate = shiftCoordinate(stop.building.coordinate, offset);
  const label = isNow
    ? `Now · ${stop.building.shortName}`
    : `${formatTimeShort(stop.session.start)} · ${stop.building.shortName}`;

  return (
    <>
      {/* Círculo numerado (com "anel" se for a aula de agora) */}
      <Marker
        coordinate={coordinate}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={tracks}
        zIndex={isHere ? 60 : 10}
        title={`${stop.session.course} · ${stop.session.kind}`}
        description={`${stop.building.name}${stop.session.room ? ` · ${stop.session.room}` : ''}`}
      >
        <View style={styles.markerBox}>
          {isNow && <View style={[styles.ring, { backgroundColor: dotColor }, isHere && styles.hereRing]} />}
          <View style={[styles.circle, { backgroundColor: dotColor }, isHere && styles.hereCircle, isPast && styles.past]}>
            {isNow ? <View style={styles.nowDot} /> : <Text style={styles.number}>{stop.index + 1}</Text>}
          </View>
        </View>
      </Marker>

      {/* Chip com horário/prédio, ancorado logo abaixo do círculo */}
      {showChip && (
        <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0 }} tracksViewChanges={tracks} zIndex={9} tappable={false}>
          <View style={styles.chipBox}>
            <View style={[styles.chip, isPast && styles.past]}>
              <Text style={[styles.chipText, isNow && { color: dotColor }]} numberOfLines={1}>
                {label}
              </Text>
            </View>
          </View>
        </Marker>
      )}
    </>
  );
}

const CIRCLE = 26;
const RING = 46;

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  markerBox: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, opacity: 0.25 },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { fontFamily: fonts.semibold, fontSize: 12, color: colors.onInk },
  nowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.onInk },
  past: { opacity: 0.55 },
  // "Você está aqui": anel mais forte e círculo um pouco maior, com borda clara.
  hereRing: { opacity: 0.3 },
  hereCircle: { width: CIRCLE + 4, height: CIRCLE + 4, borderRadius: (CIRCLE + 4) / 2, borderWidth: 3 },
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
