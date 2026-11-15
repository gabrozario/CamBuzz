import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Checkbox } from '../../components/Checkbox';
import { fonts, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import type { ResourceCategory, ResourceLocation } from '../../types';

interface Props {
  category: ResourceCategory;
  checked: boolean;
  expanded: boolean;
  onToggleCheck: () => void;
  onToggleExpand: () => void;
  onSelectLocation: (loc: ResourceLocation) => void;
  selectedLocationId?: string;
}

/** Uma linha de categoria de recursos (Libraries, Printers, CRC...) com checkbox e sub-locais expansíveis. */
export function ResourceCategoryRow({
  category,
  checked,
  expanded,
  onToggleCheck,
  onToggleExpand,
  onSelectLocation,
  selectedLocationId,
}: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const count = category.locations.length;
  const isSingle = count === 1;

  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        {/* Checkbox */}
        <Pressable
          onPress={onToggleCheck}
          hitSlop={8}
          style={styles.checkboxTouch}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel={`Toggle ${category.name}`}
        >
          <Checkbox checked={checked} />
        </Pressable>

        {/* Título e subtítulo (toque alterna expansão) */}
        <Pressable
          onPress={onToggleExpand}
          style={styles.contentTouch}
          accessibilityRole="button"
          accessibilityLabel={`${expanded ? 'Hide' : 'Show'} ${category.name} locations`}
        >
          <Text style={styles.categoryName}>{category.name}</Text>
          <View style={styles.subtitleRow}>
            {expanded ? (
              <>
                <Text style={styles.subtitleText}>Hide locations</Text>
                <ChevronUp size={14} color={colors.muted} strokeWidth={2} />
              </>
            ) : (
              <>
                <Text style={styles.subtitleText}>
                  {count} location{isSingle ? '' : 's'}
                </Text>
                {!isSingle && <ChevronDown size={14} color={colors.muted} strokeWidth={2} />}
              </>
            )}
          </View>
        </Pressable>

        {/* Bolinha colorida na extremidade direita */}
        <View style={[styles.dot, { backgroundColor: category.color }]} />
      </View>

      {/* Lista de locais expandida */}
      {expanded && (
        <View style={styles.locationsList}>
          {category.locations.map((loc) => {
            const isSelected = selectedLocationId === loc.id;
            return (
              <Pressable
                key={loc.id}
                onPress={() => onSelectLocation(loc)}
                style={({ pressed }) => [
                  styles.locationRow,
                  isSelected && styles.locationRowSelected,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${loc.code}: ${loc.name}`}
              >
                <Text style={[styles.locationCode, isSelected && styles.locationCodeSelected]}>
                  {loc.code}
                </Text>
                <View style={styles.locationInfo}>
                  <Text style={[styles.locationName, isSelected && styles.locationNameSelected]}>
                    {loc.name}
                  </Text>
                  {loc.details && loc.details.length > 0 && (
                    <Text style={styles.locationDetailText} numberOfLines={1}>
                      {loc.details[0]}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  checkboxTouch: {
    padding: 2,
  },
  contentTouch: {
    flex: 1,
    gap: 4,
  },
  categoryName: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.ink,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subtitleText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  locationsList: {
    paddingLeft: 44,
    paddingTop: 8,
    gap: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 6,
  },
  locationRowSelected: {
    backgroundColor: colors.activeTab,
    paddingHorizontal: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  locationCode: {
    width: 32,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.muted,
  },
  locationCodeSelected: {
    color: colors.ink,
    fontFamily: fonts.semibold,
  },
  locationInfo: {
    flex: 1,
    gap: 2,
  },
  locationName: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
  },
  locationNameSelected: {
    fontFamily: fonts.semibold,
  },
  locationDetailText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
  },
});
