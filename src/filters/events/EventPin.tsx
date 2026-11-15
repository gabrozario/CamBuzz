import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { PlacePin, placePinAnchor, PlacePinLabel, placePinSize } from '../../components/map/PlacePin';
import { useTracksViewChanges } from '../../components/map/useTracksViewChanges';
import { fonts, radius, shadow, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import { eventMapLabel } from './eventLabel';
import type { EventEntry } from './useEventsFilter';

interface Props {
  entry: EventEntry;
  selected?: boolean;
  /** Mostrar o nome embaixo do alfinete (só com zoom, como os nomes do Google/Apple Maps). */
  showLabel?: boolean;
  onPress: () => void;
}


/** Alfinete numerado de um evento (escuro, como no Figma). Selecionado = maior, com o nome em cima. */
export function EventPin({ entry, selected = false, showLabel = false, onPress }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const friendDots = entry.friends.slice(0, 3).map((f) => ({ id: f.person.id, color: f.person.color }));
  const tracks = useTracksViewChanges([selected, entry.number, !!entry.match, friendDots.map((d) => d.id).join(), showLabel]);
  const offRoute = !entry.match;
  const pinHeight = placePinSize(selected).height;
  // O nome faz parte do marcador (tocar no nome também abre o evento).
  const withLabel = showLabel && !selected;

  return (
    <>
      {/* anchor → a PONTA do alfinete fica no local do evento */}
      <Marker
        coordinate={entry.event.coordinate}
        anchor={placePinAnchor(selected, withLabel)}
        tracksViewChanges={tracks}
        zIndex={selected ? 30 : 20}
        onPress={onPress}
      >
        <View style={styles.pinColumn}>
          <PlacePin
            label={String(entry.number)}
            color={offRoute ? colors.muted : colors.ink}
            textColor={offRoute ? colors.white : colors.onInk}
            selected={selected}
            dots={friendDots}
          />
          {withLabel && <PlacePinLabel text={eventMapLabel(entry.event)} />}
        </View>
      </Marker>

      {selected && (
        // Chip com o nome, acima do alfinete.
        <Marker
          coordinate={entry.event.coordinate}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={tracks}
          // Abaixo do alfinete (30): no Android "tappable" não funciona e o chip roubaria o toque.
          zIndex={29}
          tappable={false}
        >
          <View style={[styles.chipBox, { paddingBottom: pinHeight + 4 }]}>
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

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    pinColumn: { alignItems: 'center' },
    chipBox: { paddingHorizontal: 6, paddingTop: 6 },
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
