import { useMemo } from 'react';
import { ClusterPin } from '../../components/map/ClusterPin';
import { useMapViewport } from '../../components/map/mapViewport';
import type { ResourceLocation } from '../../types';
import { clusterOnScreen } from '../../utils/cluster';
import { mapLabel } from '../../utils/mapLabel';
import { ResourcePin } from './ResourcePin';
import type { ResourcesFilterState } from './useResourcesFilter';

interface Props {
  state: ResourcesFilterState;
}

/** Camada do mapa com os pinos de recursos do campus (vai dentro de <CampusMap>). */
export function ResourcesLayer({ state }: Props) {
  const { categories, selectedCategories, selectedLocation, selectedBuildingDetails, openDetails, selectLocation } =
    state;
  const { viewport, width, height, zoomTo, showPlaceLabels } = useMapViewport();

  const isSelected = (loc: ResourceLocation) =>
    selectedLocation?.id === loc.id ||
    (selectedBuildingDetails != null && selectedBuildingDetails.buildingId === loc.buildingId);

  // Pinos visíveis (com a cor da categoria). Os selecionados ficam fora dos grupos.
  const pins = useMemo(
    () =>
      categories
        .filter((cat) => selectedCategories.has(cat.id))
        .flatMap((cat) => cat.locations.map((loc) => ({ loc, color: cat.color, categoryId: cat.id }))),
    [categories, selectedCategories],
  );
  // O selecionado aparece SEMPRE (mesmo com a categoria desmarcada — ex.: veio da busca).
  // (o próprio local escolhido; outros do mesmo prédio só se a categoria deles estiver marcada)
  const selectedPins = categories.flatMap((cat) =>
    cat.locations
      .filter((loc) => selectedLocation?.id === loc.id || (isSelected(loc) && selectedCategories.has(cat.id)))
      .map((loc) => ({ loc, color: cat.color, categoryId: cat.id })),
  );
  const clusters = useMemo(
    () =>
      clusterOnScreen(
        pins.filter((p) => !isSelected(p.loc)),
        (p) => p.loc.coordinate,
        (p) => p.loc.id,
        viewport,
        width,
        height,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pins, selectedLocation?.id, selectedBuildingDetails?.buildingId, viewport, width, height],
  );

  // Tocar no pino abre a descrição: ocupação (bibliotecas/CRC) ou detalhe simples (impressoras).
  const open = (loc: ResourceLocation) => (loc.hasDetails ? openDetails(loc.buildingId, loc) : selectLocation(loc));
  // Nome com zoom só para as bibliotecas (impressoras e CRC não).
  const pin = (loc: ResourceLocation, color: string, categoryId: string, selected = false) => (
    <ResourcePin
      key={loc.id}
      location={loc}
      color={color}
      selected={selected}
      label={showPlaceLabels && categoryId === 'libraries' ? mapLabel(loc) : undefined}
      onPress={() => open(loc)}
    />
  );

  // Com um lugar aberto, só ele aparece (os outros somem; voltam ao fechar a descrição).
  return (
    <>
      {selectedPins.length === 0 && clusters.map((c) =>
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
      {selectedPins.map((p) => pin(p.loc, p.color, p.categoryId, true))}
    </>
  );
}
