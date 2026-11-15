import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { useTracksViewChanges } from '../../components/map/useTracksViewChanges';
import { fonts, radius, shadow, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import type { LatLng } from '../../types';
import type { SharedBuilding } from './peopleDay';

interface Props {
  shared: SharedBuilding;
  /** Centro do card (escolhido por placeCallouts para não cobrir bolinhas nem outros cards). */
  position: LatLng;
}

/** Altura fixa do card (padding 6 + título 16 + 1 + linha 14 + padding 6). */
export const CALLOUT_HEIGHT = 43;
/** Espaço em volta do card (para a sombra) — igual em todos os lados, para o centro ficar no lugar certo. */
const BOX_PAD = 6;

/**
 * Card branco perto de um prédio: "Clough Commons / You now · Maya 11:30" (Figma "People · You and Maya").
 * Fica CENTRALIZADO em `position` (anchor 0.5/0.5 — o iPhone já centraliza sozinho), que o PeopleLayer
 * escolhe no lugar livre mais perto do prédio.
 */
export function SharedBuildingCallout({ shared, position }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { legible } = useAppTheme();
  const tracks = useTracksViewChanges([shared.line, shared.color]);
  return (
    <Marker
      coordinate={position}
      anchor={{ x: 0.5, y: 0.5 }}
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
  box: { padding: BOX_PAD },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 220,
    height: CALLOUT_HEIGHT,
    ...shadow,
  },
  title: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16 },
  line: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 14, color: colors.muted, marginTop: 1 },
});
