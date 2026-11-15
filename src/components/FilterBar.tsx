import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FILTERS } from '../filters/filterConfig';
import { fonts, spacing, useAppTheme, useThemedStyles, type Palette } from '../theme';
import type { FilterKey } from '../types';

interface Props {
  active: FilterKey[];
  onPress: (key: FilterKey) => void;
  bottomInset: number;
}

/** Barra inferior com os 4 filtros (Events, Campus resources, Food options, People). */
export function FilterBar({ active, onPress, bottomInset }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(bottomInset, spacing.sm) }]}>
      {FILTERS.map(({ key, label, icon: Icon }) => {
        const isActive = active.includes(key);
        return (
          <Pressable
            key={key}
            onPress={() => onPress(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => [styles.item, isActive && styles.itemActive, pressed && styles.pressed]}
          >
            <Icon size={22} color={isActive ? colors.ink : colors.muted} strokeWidth={1.6} />
            <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 22,
  },
  itemActive: { backgroundColor: colors.activeTab },
  pressed: { opacity: 0.7 },
  label: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  labelActive: { fontFamily: fonts.semibold, color: colors.ink },
});
