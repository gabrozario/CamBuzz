import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { PlacePin, placePinSize } from '../../components/map/PlacePin';
import { useTracksViewChanges } from '../../components/map/useTracksViewChanges';
import { fonts, radius, shadow, useThemedStyles, type Palette } from '../../theme';
import type { ResourceLocation } from '../../types';

interface Props {
  /** Qualquer local com código e coordenada (também usado pelo filtro Food options). */
  location: Pick<ResourceLocation, 'id' | 'code' | 'name' | 'coordinate'>;
  color: string;
  selected?: boolean;
  onPress: () => void;
}

/** Alfinete de um recurso/comida no campus (L1, P1, C3...). Selecionado = maior, com o nome em cima. */
export function ResourcePin({ location, color, selected = false, onPress }: Props) {
  const styles = useThemedStyles(makeStyles);
  const tracks = useTracksViewChanges([selected, location.id, location.code, color]);
  const pinHeight = placePinSize(selected).height;

  return (
    <>
      {/* anchor y: 1 → a PONTA do alfinete fica no local */}
      <Marker
        coordinate={location.coordinate}
        anchor={{ x: 0.5, y: 1 }}
        tracksViewChanges={tracks}
        zIndex={selected ? 30 : 20}
        onPress={onPress}
      >
        <PlacePin label={location.code} color={color} selected={selected} />
      </Marker>

      {selected && (
        <Marker
          coordinate={location.coordinate}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={tracks}
          // Abaixo do alfinete (30): no Android "tappable" não funciona e o chip roubaria o toque.
          zIndex={29}
          tappable={false}
        >
          <View style={[styles.chipBox, { paddingBottom: pinHeight + 4 }]}>
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
