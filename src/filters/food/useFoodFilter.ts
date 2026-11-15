import { useCallback, useMemo, useState } from 'react';
import { foodCategories } from '../../../data';
import type { FoodCategory, FoodLocation } from '../../types';

export interface FoodFilterState {
  categories: FoodCategory[];
  selectedCategories: Set<string>;
  expandedCategories: Set<string>;
  /** Local aberto no detalhe (cardápio). null = mostrando a lista de categorias. */
  selectedLocation: FoodLocation | null;
  activeLocations: FoodLocation[];
  isAllSelected: boolean;
  isNoneSelected: boolean;
  isIndeterminate: boolean;
  selectedCategoriesCount: number;
  toggleCategory: (categoryId: string) => void;
  toggleExpanded: (categoryId: string) => void;
  toggleSelectAll: () => void;
  /** Abre o cardápio do local (e liga a categoria dele, para o pino aparecer no mapa). */
  openLocation: (location: FoodLocation) => void;
  clearSelection: () => void;
  /** Volta tudo ao início (nada marcado, nada expandido) — chamado ao desligar o filtro. */
  reset: () => void;
}

function toggleInSet(prev: Set<string>, id: string): Set<string> {
  const next = new Set(prev);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** ESTADO do filtro Food options: categorias marcadas, expandidas e o local aberto. */
export function useFoodFilter(): FoodFilterState {
  const categories = foodCategories;
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(() => new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set());
  const [selectedLocation, setSelectedLocation] = useState<FoodLocation | null>(null);

  const isAllSelected = selectedCategories.size === categories.length;
  const isNoneSelected = selectedCategories.size === 0;

  const activeLocations = useMemo(
    () => categories.filter((c) => selectedCategories.has(c.id)).flatMap((c) => c.locations),
    [categories, selectedCategories],
  );

  const toggleCategory = useCallback((id: string) => setSelectedCategories((prev) => toggleInSet(prev, id)), []);
  const toggleExpanded = useCallback((id: string) => setExpandedCategories((prev) => toggleInSet(prev, id)), []);

  const toggleSelectAll = useCallback(() => {
    setSelectedCategories(isAllSelected ? new Set() : new Set(categories.map((c) => c.id)));
  }, [isAllSelected, categories]);

  const openLocation = useCallback(
    (location: FoodLocation) => {
      const cat = categories.find((c) => c.locations.some((l) => l.id === location.id));
      if (cat) setSelectedCategories((prev) => (prev.has(cat.id) ? prev : new Set(prev).add(cat.id)));
      setSelectedLocation(location);
    },
    [categories],
  );

  const clearSelection = useCallback(() => setSelectedLocation(null), []);

  const reset = useCallback(() => {
    setSelectedCategories(new Set());
    setExpandedCategories(new Set());
    setSelectedLocation(null);
  }, []);

  return {
    categories,
    selectedCategories,
    expandedCategories,
    selectedLocation,
    activeLocations,
    isAllSelected,
    isNoneSelected,
    isIndeterminate: !isNoneSelected && !isAllSelected,
    selectedCategoriesCount: selectedCategories.size,
    toggleCategory,
    toggleExpanded,
    toggleSelectAll,
    openLocation,
    clearSelection,
    reset,
  };
}
