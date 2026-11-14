import { ResourcePin } from './ResourcePin';
import type { ResourcesFilterState } from './useResourcesFilter';

interface Props {
  state: ResourcesFilterState;
}

/** Camada do mapa com os pinos de recursos do campus (vai dentro de <CampusMap>). */
export function ResourcesLayer({ state }: Props) {
  const { categories, selectedCategories, selectedLocation, selectedBuildingDetails, openDetails, selectLocation } =
    state;

  return (
    <>
      {categories
        .filter((cat) => selectedCategories.has(cat.id))
        .map((cat) =>
          cat.locations.map((loc) => {
            const isSelected =
              selectedLocation?.id === loc.id ||
              (selectedBuildingDetails != null && selectedBuildingDetails.buildingId === loc.buildingId);

            return (
              <ResourcePin
                key={loc.id}
                location={loc}
                color={cat.color}
                selected={isSelected}
                onPress={() => {
                  if (loc.hasDetails) {
                    openDetails(loc.buildingId, loc);
                  } else {
                    selectLocation(loc);
                  }
                }}
              />
            );
          }),
        )}
    </>
  );
}
