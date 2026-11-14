import { useCallback, useMemo, useState } from 'react';
import { getBuildingOccupancy, resourceCategories } from '../../../data';
import type { BuildingOccupancyDetails, ResourceCategory, ResourceLocation } from '../../types';

export interface ResourcesFilterState {
  categories: ResourceCategory[];
  selectedCategories: Set<string>;
  expandedCategories: Set<string>;
  selectedLocation: ResourceLocation | null;
  selectedBuildingDetails: BuildingOccupancyDetails | null;
  activeLocations: ResourceLocation[];
  isAllSelected: boolean;
  isNoneSelected: boolean;
  isIndeterminate: boolean;
  totalLocationsCount: number;
  selectedCategoriesCount: number;
  toggleCategory: (categoryId: string) => void;
  toggleExpanded: (categoryId: string) => void;
  toggleSelectAll: () => void;
  selectLocation: (location: ResourceLocation | null) => void;
  openDetails: (buildingId: string, specificLoc?: ResourceLocation) => void;
  closeDetails: () => void;
  clearSelection: () => void;
}

/** Hook que gerencia o estado do filtro Campus Resources. */
export function useResourcesFilter(): ResourcesFilterState {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(() => new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set());
  const [selectedLocation, setSelectedLocation] = useState<ResourceLocation | null>(null);
  const [selectedBuildingDetails, setSelectedBuildingDetails] = useState<BuildingOccupancyDetails | null>(null);

  const categories = resourceCategories;
  const isAllSelected = selectedCategories.size === categories.length;
  const isNoneSelected = selectedCategories.size === 0;
  const isIndeterminate = selectedCategories.size > 0 && !isAllSelected;

  const activeLocations = useMemo(() => {
    return categories
      .filter((cat) => selectedCategories.has(cat.id))
      .flatMap((cat) => cat.locations);
  }, [categories, selectedCategories]);

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const toggleExpanded = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(categories.map((c) => c.id)));
    }
  }, [isAllSelected, categories]);

  const selectLocation = useCallback((location: ResourceLocation | null) => {
    setSelectedLocation(location);
  }, []);

  const openDetails = useCallback(
    (buildingId: string, specificLoc?: ResourceLocation) => {
      const details = getBuildingOccupancy(buildingId);
      if (details) {
        setSelectedBuildingDetails(details);
        if (specificLoc) {
          setSelectedLocation(specificLoc);
        } else {
          const loc = activeLocations.find((l) => l.buildingId === buildingId);
          if (loc) {
            setSelectedLocation(loc);
          }
        }
      }
    },
    [activeLocations],
  );

  const closeDetails = useCallback(() => {
    setSelectedBuildingDetails(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedLocation(null);
    setSelectedBuildingDetails(null);
  }, []);

  return {
    categories,
    selectedCategories,
    expandedCategories,
    selectedLocation,
    selectedBuildingDetails,
    activeLocations,
    isAllSelected,
    isNoneSelected,
    isIndeterminate,
    totalLocationsCount: activeLocations.length,
    selectedCategoriesCount: selectedCategories.size,
    toggleCategory,
    toggleExpanded,
    toggleSelectAll,
    selectLocation,
    openDetails,
    closeDetails,
    clearSelection,
  };
}
