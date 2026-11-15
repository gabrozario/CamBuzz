import { useMemo } from 'react';
import { ClusterPin } from '../../components/map/ClusterPin';
import { useMapViewport } from '../../components/map/mapViewport';
import type { FoodLocation } from '../../types';
import { clusterOnScreen } from '../../utils/cluster';
import { mapLabel } from '../../utils/mapLabel';
import { ResourcePin } from '../resources/ResourcePin';
import type { FoodFilterState } from './useFoodFilter';

interface Props {
  state: FoodFilterState;
}

/** MAPA: pinos D1/C1/V1... das categorias marcadas (vai dentro de <CampusMap>). Tocar abre o cardápio. */
export function FoodLayer({ state }: Props) {
  const { categories, selectedCategories, selectedLocation, openLocation } = state;
  const { viewport, width, height, zoomTo, showPlaceLabels } = useMapViewport();
  /** Nome com zoom: restaurantes/cafés e dining halls (vending não). */
  const labelFor = (loc: FoodLocation, categoryId: string) =>
    showPlaceLabels && categoryId !== 'vending' ? mapLabel(loc) : undefined;

  // Pinos visíveis (com a cor da categoria). O selecionado fica fora dos grupos.
  const pins = useMemo(
    () =>
      categories
        .filter((cat) => selectedCategories.has(cat.id))
        .flatMap((cat) => cat.locations.map((loc) => ({ loc, color: cat.color, categoryId: cat.id }))),
    [categories, selectedCategories],
  );
  const clusters = useMemo(
    () =>
      clusterOnScreen(
        pins.filter((p) => p.loc.id !== selectedLocation?.id),
        (p) => p.loc.coordinate,
        (p) => p.loc.id,
        viewport,
        width,
        height,
      ),
    [pins, selectedLocation?.id, viewport, width, height],
  );
  // O selecionado aparece SEMPRE (mesmo com a categoria desmarcada — ex.: veio da busca).
  const selectedCategory = selectedLocation
    ? categories.find((c) => c.locations.some((l) => l.id === selectedLocation.id))
    : undefined;
  const selectedPin =
    selectedLocation && selectedCategory
      ? { loc: selectedLocation, color: selectedCategory.color, categoryId: selectedCategory.id }
      : undefined;

  const pin = (loc: FoodLocation, color: string, categoryId: string, selected = false) => (
    <ResourcePin
      key={loc.id}
      location={loc}
      color={color}
      selected={selected}
      label={labelFor(loc, categoryId)}
      onPress={() => openLocation(loc)}
    />
  );

  // Com um lugar aberto, só ele aparece (os outros somem; voltam ao fechar a descrição).
  return (
    <>
      {!selectedPin && clusters.map((c) =>
        c.items.length === 1 ? (
          pin(c.items[0].loc, c.items[0].color, c.items[0].categoryId)
        ) : (
          <ClusterPin
            key={c.key}
            coordinate={c.coordinate}
            count={c.items.length}
            color={c.items.every((p) => p.color === c.items[0].color) ? c.items[0].color : undefined}
            onPress={() => zoomTo(c.items.map((p) => p.loc.coordinate))}
          />
        ),
      )}
      {selectedPin && pin(selectedPin.loc, selectedPin.color, selectedPin.categoryId, true)}
    </>
  );
}
