import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Checkbox } from '../../components/Checkbox';
import { FilterSheet, SHEET_MID, type FilterSheetHandle } from '../../components/sheet/FilterSheet';
import { SheetScrollView } from '../../components/sheet/SheetScrollView';
import { fonts, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import { FoodCategoryRow } from './FoodCategoryRow';
import { FoodDetails, FoodDetailsHeader } from './FoodDetails';
import type { FoodFilterState } from './useFoodFilter';

interface Props {
  state: FoodFilterState;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

/** ABA do filtro Food options: lista de categorias ou o cardápio do local selecionado. */
export function FoodSheet({ state, onClose, onIndexChange }: Props) {
  const styles = useThemedStyles(makeStyles);
  const sheetRef = useRef<FilterSheetHandle>(null);
  const {
    categories,
    selectedCategories,
    expandedCategories,
    selectedLocation,
    activeLocations,
    isAllSelected,
    isNoneSelected,
    isIndeterminate,
    selectedCategoriesCount,
    toggleCategory,
    toggleExpanded,
    toggleSelectAll,
    openLocation,
    clearSelection,
  } = state;

  // Ao abrir um cardápio, sobe a aba até o meio (se estava recolhida).
  useEffect(() => {
    if (selectedLocation) sheetRef.current?.snapTo(SHEET_MID);
  }, [selectedLocation?.id]);

  // Subtítulo igual ao Figma.
  let subtitle = 'No resources selected · Choose a filter below';
  if (isAllSelected) {
    subtitle = `${activeLocations.length} locations · All resources selected`;
  } else if (!isNoneSelected) {
    const word = selectedCategoriesCount === 1 ? 'category' : 'categories';
    subtitle = `${activeLocations.length} locations · ${selectedCategoriesCount} ${word} selected`;
  }

  return (
    <FilterSheet
      ref={sheetRef}
      title="Food Options"
      subtitle={subtitle}
      hideChevron
      customHeader={
        selectedLocation ? <FoodDetailsHeader location={selectedLocation} onBack={clearSelection} /> : undefined
      }
      onClose={onClose}
      onIndexChange={onIndexChange}
    >
      {selectedLocation ? (
        <FoodDetails location={selectedLocation} />
      ) : (
        <SheetScrollView contentContainerStyle={styles.content}>
          <Pressable
            onPress={toggleSelectAll}
            style={({ pressed }) => [styles.selectAllRow, pressed && styles.pressed]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isAllSelected }}
            accessibilityLabel="Select all food options"
          >
            <Checkbox checked={isAllSelected} indeterminate={isIndeterminate} />
            <Text style={styles.selectAllText}>Select all</Text>
          </Pressable>

          <View style={styles.divider} />

          {categories.map((cat) => (
            <FoodCategoryRow
              key={cat.id}
              category={cat}
              checked={selectedCategories.has(cat.id)}
              expanded={expandedCategories.has(cat.id)}
              onToggleCheck={() => toggleCategory(cat.id)}
              onToggleExpand={() => toggleExpanded(cat.id)}
              onOpenLocation={openLocation}
            />
          ))}

          <Text style={styles.footnote}>Illustrative locations · Scroll to see more</Text>
        </SheetScrollView>
      )}
    </FilterSheet>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  content: { paddingTop: 4, paddingBottom: 36 },
  selectAllRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingVertical: 12 },
  selectAllText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  divider: { height: 1, backgroundColor: colors.divider, marginHorizontal: 24, marginVertical: 4 },
  pressed: { opacity: 0.7 },
  footnote: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 20, marginLeft: 24 },
});
