import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../theme';

export interface LegendEntry {
  label: string;
  color: string;
  thick?: boolean;
}

interface Props {
  entries: LegendEntry[];
}

/** Legenda das linhas do mapa ("You", amigos, "Next leg"), como no Figma. */
export function RouteLegend({ entries }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {entries.map((e) => (
          <View key={e.label} style={styles.entry}>
            <View style={[styles.swatch, { backgroundColor: e.color }, e.thick && styles.swatchThick]} />
            <Text style={styles.label}>{e.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.note}>Ringed building = now · Thin line = rest of day</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: 4,
    ...shadow,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.xl, rowGap: 4 },
  entry: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  swatch: { width: 22, height: 3, borderRadius: 2 },
  swatchThick: { width: 26, height: 7, borderRadius: 4 },
  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink },
  note: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
});
