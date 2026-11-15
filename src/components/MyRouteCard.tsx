import { Route } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, radius, shadow, spacing, useAppTheme, useThemedStyles, type Palette } from '../theme';

export interface LegendEntry {
  label: string;
  color: string;
  /** Linha grossa ("Next leg"). */
  thick?: boolean;
}

interface Props {
  /** Seu caminho está ligado? */
  value: boolean;
  onChange: (value: boolean) => void;
  /** Legenda dos caminhos desenhados agora (You, amigos, Next leg). Vazia = só a pílula. */
  entries: LegendEntry[];
}

/**
 * Canto inferior esquerdo do mapa: pílula "My Route" (liga/desliga o SEU caminho; começa desligada)
 * + a legenda das linhas no MESMO cartão, quando há algum caminho no mapa.
 */
export function MyRouteCard({ value, onChange, entries }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const hasLegend = entries.length > 0;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => onChange(!value)}
        style={({ pressed }) => [styles.toggle, value && { backgroundColor: colors.green }, pressed && styles.pressed]}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        accessibilityLabel="My Route"
        hitSlop={4}
      >
        <Route size={16} color={value ? colors.surface : colors.ink} strokeWidth={2} />
        <Text style={[styles.toggleText, value && { color: colors.surface }]}>My Route</Text>
      </Pressable>

      {hasLegend && (
        <View style={styles.legend} pointerEvents="none">
          <View style={styles.row}>
            {entries.map((e) => (
              <View key={e.label} style={styles.entry}>
                <View style={[styles.swatch, { backgroundColor: e.color }, e.thick && styles.swatchThick]} />
                <Text style={styles.label}>{e.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.note}>Ringed = now · Thin line = rest of day</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      alignSelf: 'flex-start',
      maxWidth: '100%',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: 4,
      ...shadow,
    },
    toggle: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.md - 4,
    },
    pressed: { opacity: 0.75 },
    toggleText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
    legend: { paddingHorizontal: 10, paddingTop: 4, paddingBottom: 6, gap: 4 },
    row: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.lg, rowGap: 4 },
    entry: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    swatch: { width: 20, height: 3, borderRadius: 2 },
    swatchThick: { width: 22, height: 7, borderRadius: 4 },
    label: { fontFamily: fonts.medium, fontSize: 12, color: colors.ink },
    note: { fontFamily: fonts.regular, fontSize: 10, color: colors.muted },
  });
