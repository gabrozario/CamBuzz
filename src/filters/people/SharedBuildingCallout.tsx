import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { useTracksViewChanges } from '../../components/map/useTracksViewChanges';
import { fonts, radius, shadow, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import type { SharedBuilding } from './peopleDay';

interface Props {
  shared: SharedBuilding;
}

/** Card branco embaixo de um prédio: "Clough Commons / You now · Maya 11:30" (Figma "People · You and Maya"). */
export function SharedBuildingCallout({ shared }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { legible } = useAppTheme();
  const tracks = useTracksViewChanges([shared.line, shared.color]);
  return (
    <Marker
      coordinate={shared.building.coordinate}
      anchor={{ x: 0.5, y: 0 }}
      tracksViewChanges={tracks}
      zIndex={8}
      tappable={false}
    >
      <View style={styles.box}>
        <View style={styles.card}>
          <Text style={[styles.title, { color: legible(shared.color) }]} numberOfLines={1}>
            {shared.building.shortName}
          </Text>
          <Text style={styles.line} numberOfLines={1}>
            {shared.line}
          </Text>
        </View>
      </View>
    </Marker>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  // paddingTop afasta o card dos círculos do prédio; padding lateral dá espaço para a sombra.
  box: { paddingTop: 24, paddingHorizontal: 6, paddingBottom: 6 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 220,
    ...shadow,
  },
  title: { fontFamily: fonts.semibold, fontSize: 12 },
  line: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted, marginTop: 1 },
});
