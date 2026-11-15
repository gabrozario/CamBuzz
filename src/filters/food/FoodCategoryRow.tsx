import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Checkbox } from '../../components/Checkbox';
import { fonts, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import type { FoodCategory, FoodLocation } from '../../types';
import { todayISO } from '../../utils/dates';
import { nowTime } from '../../utils/time';
import { openStatus } from './foodHours';

interface Props {
  category: FoodCategory;
  checked: boolean;
  expanded: boolean;
  onToggleCheck: () => void;
  onToggleExpand: () => void;
  onOpenLocation: (loc: FoodLocation) => void;
}

/**
 * Linha de categoria (Dining hall, Restaurants/Coffees, Vending machines):
 * checkbox liga os pinos; "N locations ⌄" expande a lista; tocar num local abre o cardápio.
 */
export function FoodCategoryRow({ category, checked, expanded, onToggleCheck, onToggleExpand, onOpenLocation }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const count = category.locations.length;

  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        <Pressable
          onPress={onToggleCheck}
          hitSlop={8}
          style={styles.checkboxTouch}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel={`Show ${category.name} on the map`}
        >
          <Checkbox checked={checked} />
        </Pressable>

        <Text style={styles.categoryName}>{category.name}</Text>
        <View style={[styles.dot, { backgroundColor: category.color }]} />
      </View>

      <Pressable
        onPress={onToggleExpand}
        hitSlop={8}
        style={styles.expandRow}
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Hide' : 'Show'} ${category.name} locations`}
      >
        <Text style={styles.expandText}>{expanded ? 'Hide locations' : `${count} location${count === 1 ? '' : 's'}`}</Text>
        {expanded ? (
          <ChevronUp size={14} color={colors.ink} strokeWidth={2} />
        ) : (
          <ChevronDown size={14} color={colors.ink} strokeWidth={2} />
        )}
      </Pressable>

      {expanded && (
        <View style={styles.locationsList}>
          {category.locations.map((loc) => (
            <Pressable
              key={loc.id}
              onPress={() => onOpenLocation(loc)}
              style={({ pressed }) => [styles.locationRow, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`${loc.code}: ${loc.name}, open details`}
            >
              <Text style={styles.locationCode}>{loc.code}</Text>
              <View style={styles.locationText}>
                <Text style={styles.locationName} numberOfLines={1}>
                  {loc.name}
                </Text>
                {loc.hours && <LocationStatus location={loc} />}
              </View>
              <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

/** "Open now · until 10:00 PM · Tech Square" embaixo do nome (só locais com horário). */
function LocationStatus({ location }: { location: FoodLocation }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const status = openStatus(location.hours!, todayISO(), nowTime());
  return (
    <Text style={styles.locationStatus} numberOfLines={1}>
      <Text style={{ color: status.open ? colors.green : colors.error }}>{status.label}</Text>
      {` · ${location.area}`}
    </Text>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  container: { paddingHorizontal: 24, paddingVertical: 10 },
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  checkboxTouch: { padding: 2 },
  categoryName: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  dot: { width: 8, height: 8, borderRadius: 4 },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginLeft: 44,
    marginTop: 8,
  },
  expandText: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink },
  locationsList: { paddingLeft: 44, paddingTop: 10, gap: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  locationCode: { width: 32, fontFamily: fonts.medium, fontSize: 13, color: colors.ink },
  locationText: { flex: 1, gap: 2 },
  locationName: { fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  locationStatus: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  pressed: { opacity: 0.6 },
});
