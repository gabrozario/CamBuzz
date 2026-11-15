import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Checkbox } from '../../components/Checkbox';
import { FilterSheet, SHEET_MID, type FilterSheetHandle } from '../../components/sheet/FilterSheet';
import { SheetScrollView } from '../../components/sheet/SheetScrollView';
import { fonts, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import type { ResourceLocation } from '../../types';
import { CampusDetails, CampusDetailsHeader } from './CampusDetails';
import { ResourceCategoryRow } from './ResourceCategoryRow';
import { ResourceLocationDetails } from './ResourceLocationDetails';
import type { ResourcesFilterState } from './useResourcesFilter';

interface Props {
  state: ResourcesFilterState;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

/** Aba do filtro Campus Resources: lista de categorias com sub-locais ou detalhe do prédio. */
export function ResourcesSheet({ state, onClose, onIndexChange }: Props) {
  const styles = useThemedStyles(makeStyles);
  const sheetRef = useRef<FilterSheetHandle>(null);
  const {
    categories,
    selectedCategories,
    expandedCategories,
    selectedLocation,
    selectedBuildingDetails,
    isAllSelected,
    isNoneSelected,
    isIndeterminate,
    totalLocationsCount,
    selectedCategoriesCount,
    toggleCategory,
    toggleExpanded,
    toggleSelectAll,
    selectLocation,
    openDetails,
    closeDetails,
    clearSelection,
  } = state;

  // Recurso sem página de ocupação (ex.: impressora) aberto pelo pino ou pela lista → detalhe simples.
  const locationDetails =
    !selectedBuildingDetails && selectedLocation && !selectedLocation.hasDetails ? selectedLocation : null;
  const locationCategory = locationDetails
    ? categories.find((c) => c.locations.some((l) => l.id === locationDetails.id))
    : undefined;

  // Ao abrir o detalhe de um prédio, posiciona a aba no meio (35%)
  useEffect(() => {
    if (selectedBuildingDetails || selectedLocation) {
      sheetRef.current?.snapTo(SHEET_MID);
    }
  }, [selectedBuildingDetails?.buildingId, selectedLocation?.id]);

  // Subtítulo conforme estado de seleção (fiel ao Figma)
  let subtitle = 'No resources selected · Choose a filter below';
  if (isAllSelected) {
    subtitle = `${totalLocationsCount} locations · All resources selected`;
  } else if (!isNoneSelected) {
    const catWord = selectedCategoriesCount === 1 ? 'category' : 'categories';
    subtitle = `${totalLocationsCount} locations · ${selectedCategoriesCount} ${catWord} selected`;
  }

  const handleSelectLocation = (loc: ResourceLocation) => {
    // Garante que a categoria esteja selecionada para o pino aparecer no mapa
    const cat = categories.find((c) => c.locations.some((l) => l.id === loc.id));
    if (cat && !selectedCategories.has(cat.id)) {
      toggleCategory(cat.id);
    }

    if (loc.hasDetails) {
      openDetails(loc.buildingId, loc);
    } else {
      selectLocation(loc);
    }
  };

  return (
    <FilterSheet
      ref={sheetRef}
      title="Resources"
      subtitle={subtitle}
      hideChevron={true}
      customHeader={
        selectedBuildingDetails ? (
          <CampusDetailsHeader
            buildingName={selectedBuildingDetails.buildingName}
            onBack={closeDetails}
          />
        ) : locationDetails ? (
          <CampusDetailsHeader buildingName={locationDetails.name} onBack={clearSelection} />
        ) : undefined
      }
      onClose={onClose}
      onIndexChange={onIndexChange}
    >
      {selectedBuildingDetails ? (
        <CampusDetails details={selectedBuildingDetails} />
      ) : locationDetails ? (
        <ResourceLocationDetails location={locationDetails} category={locationCategory} />
      ) : (
        <SheetScrollView contentContainerStyle={styles.content}>
          {/* Linha "Select all" */}
          <Pressable
            onPress={toggleSelectAll}
            style={({ pressed }) => [styles.selectAllRow, pressed && styles.pressed]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isAllSelected }}
            accessibilityLabel="Select all resources"
          >
            <Checkbox checked={isAllSelected} indeterminate={isIndeterminate} />
            <Text style={styles.selectAllText}>Select all</Text>
          </Pressable>

          <View style={styles.divider} />

          {/* Categorias */}
          {categories.map((cat) => (
            <ResourceCategoryRow
              key={cat.id}
              category={cat}
              checked={selectedCategories.has(cat.id)}
              expanded={expandedCategories.has(cat.id)}
              onToggleCheck={() => toggleCategory(cat.id)}
              onToggleExpand={() => toggleExpanded(cat.id)}
              onSelectLocation={handleSelectLocation}
              selectedLocationId={selectedLocation?.id}
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
  content: {
    paddingTop: 4,
    paddingBottom: 36,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  selectAllText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: 24,
    marginVertical: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  footnote: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
});
