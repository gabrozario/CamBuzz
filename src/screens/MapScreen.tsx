import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import type MapView from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { schedule } from '../../data';
import { BackPill } from '../components/BackPill';
import { CampusMap } from '../components/map/CampusMap';
import { DayRouteLayer } from '../components/map/DayRouteLayer';
import { FilterBar } from '../components/FilterBar';
import { InfoChip } from '../components/InfoChip';
import { MapTopBar } from '../components/MapTopBar';
import { RouteLegend } from '../components/RouteLegend';
import { SHEET_COLLAPSED_HEIGHT, SHEET_HALF } from '../components/sheet/FilterSheet';
import { EventsLayer } from '../filters/events/EventsLayer';
import { EventsSheet } from '../filters/events/EventsSheet';
import { useEventsFilter } from '../filters/events/useEventsFilter';
import { useActiveFilters } from '../hooks/useActiveFilters';
import { colors, spacing } from '../theme';
import type { FilterKey, LatLng } from '../types';
import { buildDayRoute, regionFor } from '../utils/route';
import { formatTime, nowTime } from '../utils/time';

/** Filtros que já têm aba (bottom sheet) implementada. Adicione 'people' na próxima etapa. */
const FILTERS_WITH_SHEET: FilterKey[] = ['events'];

/** Margem (dp) usada ao enquadrar pontos no mapa. */
const FIT_PADDING = { top: 40, right: 40, bottom: 40, left: 40 };

/**
 * Tela principal: mapa da GT com o caminho do dia + barra de filtros.
 * Cada filtro ativo desenha sua "camada" dentro do <CampusMap> e, se tiver,
 * abre sua aba (a do filtro ligado por último fica visível).
 */
export function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { active, toggle } = useActiveFilters();
  const [mapHeight, setMapHeight] = useState(0);
  const [sheetIndex, setSheetIndex] = useState(-1); // -1 = sem aba aberta

  const now = nowTime();
  const userRoute = useMemo(() => buildDayRoute(schedule.classes, now), [now]);
  const stopCoords = useMemo(() => userRoute.stops.map((s) => s.building.coordinate), [userRoute]);
  const initialRegion = useMemo(() => regionFor(stopCoords), [stopCoords]);

  // ---- Filtro de Eventos ----
  const events = useEventsFilter(userRoute, now);
  const eventsOn = active.includes('events');
  const selectedEvent = eventsOn ? events.selected : null;

  // Aba visível = último filtro ligado que tem aba.
  const sheetFilter = [...active].reverse().find((k) => FILTERS_WITH_SHEET.includes(k));

  useEffect(() => {
    setSheetIndex(sheetFilter ? SHEET_HALF : -1);
  }, [sheetFilter]);

  // Ao desligar o filtro de Eventos, esquece o evento selecionado.
  useEffect(() => {
    if (!eventsOn) events.clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsOn]);

  // Espaço que a aba ocupa embaixo do mapa — o Google Maps centraliza o conteúdo acima dela.
  const sheetHeight =
    sheetIndex < 0 ? 0 : sheetIndex === 0 ? SHEET_COLLAPSED_HEIGHT : Math.round(mapHeight * 0.5);
  const paddingBottom = sheetIndex < 0 ? 90 : sheetHeight;
  const mapPadding = useMemo(
    () => ({ top: insets.top + 130, bottom: paddingBottom, left: 16, right: 16 }),
    [insets.top, paddingBottom],
  );

  // ---- Câmera: enquadra o que importa conforme o estado ----
  const fit = useCallback((coords: LatLng[]) => {
    mapRef.current?.fitToCoordinates(coords, { edgePadding: FIT_PADDING, animated: true });
  }, []);

  useEffect(() => {
    // Pequeno atraso para o mapPadding novo ser aplicado antes de mover a câmera.
    const t = setTimeout(() => {
      if (selectedEvent) {
        const { latitude, longitude } = selectedEvent.event.coordinate;
        mapRef.current?.animateToRegion(
          { latitude, longitude, latitudeDelta: 0.004, longitudeDelta: 0.004 },
          400,
        );
      } else if (eventsOn) {
        fit([...stopCoords, ...events.entries.map((e) => e.event.coordinate)]);
      } else {
        fit(stopCoords);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsOn, selectedEvent?.event.id, events.showAll]);

  // Botão "voltar" do Android: detalhe → lista → fecha a aba.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedEvent) {
        events.clearSelection();
        return true;
      }
      if (sheetFilter) {
        toggle(sheetFilter);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [selectedEvent, sheetFilter, toggle, events.clearSelection]);

  return (
    <View style={styles.screen}>
      <View style={styles.mapArea} onLayout={(e) => setMapHeight(e.nativeEvent.layout.height)}>
        <CampusMap ref={mapRef} initialRegion={initialRegion} padding={mapPadding}>
          <DayRouteLayer route={userRoute} color={colors.green} highlightNextLeg />
          {eventsOn && <EventsLayer state={events} />}
          {/* Próxima etapa: {peopleOn && <FriendsLayer ... />} */}
        </CampusMap>

        <MapTopBar
          topInset={insets.top}
          leftAccessory={
            selectedEvent ? <BackPill label="All events" onPress={events.clearSelection} /> : undefined
          }
        >
          {!selectedEvent && <InfoChip label={`Your day · Today · ${formatTime(now)}`} />}
        </MapTopBar>

        {!sheetFilter && (
          <View style={styles.legend} pointerEvents="none">
            <RouteLegend
              entries={[
                { label: 'You', color: colors.green },
                { label: 'Next leg', color: colors.ink, thick: true },
              ]}
            />
          </View>
        )}

        {/* A aba fica dentro da área do mapa, então sobe até a barra de filtros sem cobri-la. */}
        {sheetFilter === 'events' && (
          <EventsSheet state={events} onClose={() => toggle('events')} onIndexChange={setSheetIndex} />
        )}
      </View>

      <FilterBar active={active} onPress={toggle} bottomInset={insets.bottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mapBackground },
  mapArea: { flex: 1 },
  legend: { position: 'absolute', left: 18, right: 18, bottom: spacing.md },
});
