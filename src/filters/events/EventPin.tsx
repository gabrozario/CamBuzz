import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { useTracksViewChanges } from '../../components/map/useTracksViewChanges';
import { fonts, radius, shadow, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import type { EventEntry } from './useEventsFilter';

interface Props {
  entry: EventEntry;
  selected?: boolean;
  onPress: () => void;
}

/** Pino numerado de um evento (círculo escuro, como no Figma). Selecionado = com halo e nome. */
export function EventPin({ entry, selected = false, onPress }: Props) {
  const styles = useThemedStyles(makeStyles);
  const friendDots = entry.friends.slice(0, 3).map((f) => ({ id: f.person.id, color: f.person.color }));
  const tracks = useTracksViewChanges([selected, entry.number, !!entry.match, friendDots.map((d) => d.id).join()]);
  const offRoute = !entry.match;
  const boxSize = selected ? HALO : SMALL;

  return (
    <>
      <Marker
        coordinate={entry.event.coordinate}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={tracks}
        zIndex={selected ? 30 : 20}
        onPress={onPress}
      >
        {/* A "foto" do marcador tem o tamanho do que se vê: só cresce (halo) quando selecionado.
            Assim a área de toque não invade os pinos vizinhos. */}
        <View style={[styles.box, { width: boxSize, height: boxSize }]}>
          {selected && <View style={styles.halo} />}
          <View style={[styles.circle, offRoute && styles.offRoute]}>
            <Text style={styles.number}>{entry.number}</Text>
          </View>
          {/* Bolinhas com a cor dos amigos que podem ir junto */}
          {friendDots.length > 0 && (
            <View style={[styles.friendDots, { top: boxSize / 2 - CIRCLE / 2 - 4, left: boxSize / 2 + 6 }]}>
              {friendDots.map((d) => (
                <View key={d.id} style={[styles.friendDot, { backgroundColor: d.color }]} />
              ))}
            </View>
          )}
        </View>
      </Marker>

      {selected && (
        // Chip com o nome, acima do pino (anchor y: 1 = a base do chip fica no ponto).
        <Marker
          coordinate={entry.event.coordinate}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={tracks}
          // Abaixo do pino (30): no Android "tappable" não funciona e o chip roubaria o toque do pino.
          zIndex={29}
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
/** Pino não selecionado: círculo + espaço para as bolinhas dos amigos. */
const SMALL = CIRCLE + 16;

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
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
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offRoute: { backgroundColor: colors.muted },
  // Canto superior direito do círculo (o box tem 72 de lado; o círculo, 30, centralizado).
  friendDots: { position: 'absolute', flexDirection: 'row' },
  friendDot: { width: 11, height: 11, borderRadius: 6, borderWidth: 1.5, borderColor: colors.surface, marginLeft: -3 },
  number: { fontFamily: fonts.semibold, fontSize: 13, color: colors.onInk },
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
