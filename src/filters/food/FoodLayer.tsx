import { ResourcePin } from '../resources/ResourcePin';
import type { FoodFilterState } from './useFoodFilter';

interface Props {
  state: FoodFilterState;
}

/** MAPA: pinos D1/C1/V1... das categorias marcadas (vai dentro de <CampusMap>). Tocar abre o cardápio. */
export function FoodLayer({ state }: Props) {
  const { categories, selectedCategories, selectedLocation, openLocation } = state;

  return (
    <>
      {categories
        .filter((cat) => selectedCategories.has(cat.id))
        .flatMap((cat) =>
          cat.locations.map((loc) => (
            <ResourcePin
              key={loc.id}
              location={loc}
              color={cat.color}
              selected={selectedLocation?.id === loc.id}
              onPress={() => openLocation(loc)}
            />
          )),
        )}
    </>
  );
}
