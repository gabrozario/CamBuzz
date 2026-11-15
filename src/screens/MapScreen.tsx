import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import type MapView from 'react-native-maps';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackPill } from '../components/BackPill';
import { AddFriendModal } from '../components/friends/AddFriendModal';
import { CampusMap } from '../components/map/CampusMap';
import { DayRouteLayer } from '../components/map/DayRouteLayer';
import { FilterBar } from '../components/FilterBar';
import { InfoChip } from '../components/InfoChip';
import { MapTopBar } from '../components/MapTopBar';
import { RouteLegend, type LegendEntry } from '../components/RouteLegend';
import { FloatingBarContext, useFloatingBarController } from '../components/floatingBar';
import { BottomClearanceContext } from '../components/sheet/bottomClearance';
import { SHEET_MID, sheetHeightAt } from '../components/sheet/FilterSheet';
import { EventsLayer } from '../filters/events/EventsLayer';
import { EventsSheet } from '../filters/events/EventsSheet';
import type { Companion } from '../filters/events/eventsWithFriends';
import { useEventsFilter } from '../filters/events/useEventsFilter';
import { FoodLayer } from '../filters/food/FoodLayer';
import { FoodSheet } from '../filters/food/FoodSheet';
import { useFoodFilter } from '../filters/food/useFoodFilter';
import type { PersonDay } from '../filters/people/peopleDay';
import { PeopleLayer } from '../filters/people/PeopleLayer';
import { PeopleSheet } from '../filters/people/PeopleSheet';
import { usePeopleFilter } from '../filters/people/usePeopleFilter';
import { ResourcesLayer } from '../filters/resources/ResourcesLayer';
import { ResourcesSheet } from '../filters/resources/ResourcesSheet';
import { useResourcesFilter } from '../filters/resources/useResourcesFilter';
import { useActiveFilters } from '../hooks/useActiveFilters';
import { enhanceDayRouteWithORS } from '../services/routing/openRouteService';
import { useSchedule } from '../services/schedule/ScheduleProvider';
import { spacing, useAppTheme, useThemedStyles, type Palette } from '../theme';
import type { FilterKey, LatLng } from '../types';
import { buildDayRoute, regionFor, type DayRoute } from '../utils/route';
import { formatTime, nowTime } from '../utils/time';

/** Filtros que já têm aba (bottom sheet) implementada. */
const FILTERS_WITH_SHEET: FilterKey[] = ['events', 'people', 'resources', 'food'];

/** Array vazio fixo (um `[]` novo a cada render faria os useMemo recalcularem sempre). */
const NO_DAYS: PersonDay[] = [];

/** Margem (dp) usada ao enquadrar pontos no mapa. */
const FIT_PADDING = { top: 40, right: 40, bottom: 40, left: 40 };

/**
 * Tela principal: mapa da GT com o caminho do dia + barra de filtros.
 * Cada filtro ativo desenha sua "camada" dentro do <CampusMap>. Só uma aba
 * aparece por vez (a do filtro em foco), mas as camadas de todos os filtros
 * ligados aparecem juntas — ex.: Events + People = eventos para ir com amigos.
 */
interface Props {
  /** false quando outra tela (Schedule/Settings) está por cima — o mapa não trata o botão voltar. */
  focused?: boolean;
  onOpenSchedule?: () => void;
  onOpenSettings?: () => void;
}

export function MapScreen({ focused = true, onOpenSchedule, onOpenSettings }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  // Até 2 filtros ligados; `focus` = o que você está vendo (a aba dele fica aberta).
  const { active, focus, press, remove } = useActiveFilters();
  const [mapHeight, setMapHeight] = useState(0);
  const [barHeight, setBarHeight] = useState(76); // medido no onLayout da barra
  const [sheetIndex, setSheetIndex] = useState(-1); // -1 = sem aba aberta
  const [addFriendOpen, setAddFriendOpen] = useState(false);

  const now = nowTime();
  // Suas paradas de hoje vêm da agenda (My schedule): aulas + eventos com prédio.
  const { todayClasses } = useSchedule();
  const baseUserRoute = useMemo(() => buildDayRoute(todayClasses, now), [todayClasses, now]);
  const [userRoute, setUserRoute] = useState<DayRoute>(baseUserRoute);

  useEffect(() => {
    let isMounted = true;
    setUserRoute(baseUserRoute);
    enhanceDayRouteWithORS(baseUserRoute)
      .then((enhanced) => {
        if (isMounted) setUserRoute(enhanced);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [baseUserRoute]);
  const stopCoords = useMemo(() => userRoute.stops.map((s) => s.building.coordinate), [userRoute]);
  const initialRegion = useMemo(() => regionFor(stopCoords), [stopCoords]);

  // ---- Filtro People ----
  const people = usePeopleFilter(now);
  const peopleOn = active.includes('people');
  const visibleDays = peopleOn ? people.visibleDays : NO_DAYS;

  // ---- Filtro Events (+ amigos visíveis, se People estiver ligado) ----
  const companions: Companion[] = useMemo(
    () => visibleDays.filter((d) => !d.person.isMe).map((d) => ({ person: d.person, route: d.route })),
    [visibleDays],
  );
  const events = useEventsFilter(userRoute, now, companions);
  const eventsOn = active.includes('events');
  const selectedEvent = eventsOn ? events.selected : null;

  // ---- Filtro Campus Resources ----
  const resources = useResourcesFilter();
  const resourcesOn = active.includes('resources');
  const selectedResource = resourcesOn ? resources.selectedLocation : null;
  const selectedBuildingDetails = resourcesOn ? resources.selectedBuildingDetails : null;

  // ---- Filtro Food options ----
  const food = useFoodFilter();
  const foodOn = active.includes('food');
  const selectedFood = foodOn ? food.selectedLocation : null;

  // ---- Qual aba aparece ----
  const sheetFilter = focus && FILTERS_WITH_SHEET.includes(focus) ? focus : null;

  useEffect(() => {
    setSheetIndex(sheetFilter ? SHEET_MID : -1);
  }, [sheetFilter]);

  // Ao desligar os filtros, limpa as seleções.
  useEffect(() => {
    if (!eventsOn) events.clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsOn]);

  useEffect(() => {
    if (!resourcesOn) resources.clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourcesOn]);

  useEffect(() => {
    if (!foodOn) food.clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodOn]);

  // Espaço que a aba ocupa embaixo do mapa — o Google Maps centraliza o conteúdo acima dela.
  // Barra de filtros "voadora": distância até a borda de baixo e quanto ela cobre da tela.
  const barBottom = Math.max(insets.bottom, spacing.md) + spacing.sm;
  const clearance = barHeight + barBottom + spacing.sm;
  const sheetHeight = sheetHeightAt(sheetIndex, mapHeight, clearance);
  // Encolhe ao rolar uma lista para baixo; volta ao rolar para cima.
  const floatingBar = useFloatingBarController(barHeight, barBottom);

  // Trocou de filtro, abriu/fechou ou mudou a altura da aba → a barra volta ao tamanho normal.
  const expandBar = floatingBar.control.expand;
  useEffect(() => {
    expandBar();
  }, [sheetFilter, sheetIndex, expandBar]);
  const paddingBottom = sheetIndex < 0 ? clearance + 10 : sheetHeight + (sheetFilter === 'people' ? 80 : 0);
  const mapPadding = useMemo(
    () => ({ top: insets.top + 130, bottom: paddingBottom, left: 16, right: 16 }),
    [insets.top, paddingBottom],
  );

  // ---- Câmera: enquadra o que importa conforme o estado ----
  const fit = useCallback((coords: LatLng[]) => {
    if (coords.length) mapRef.current?.fitToCoordinates(coords, { edgePadding: FIT_PADDING, animated: true });
  }, []);

  const visibleKey = visibleDays.map((d) => d.person.id).join();
  useEffect(() => {
    // Pequeno atraso para o mapPadding novo ser aplicado antes de mover a câmera.
    const t = setTimeout(() => {
      if (selectedBuildingDetails) {
        // Enquadra o prédio em detalhes (ex.: Clough Commons)
        const loc = resources.activeLocations.find((l) => l.buildingId === selectedBuildingDetails.buildingId);
        if (loc) {
          const { latitude, longitude } = loc.coordinate;
          mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.004, longitudeDelta: 0.004 }, 400);
          return;
        }
      }
      if (selectedFood) {
        const { latitude, longitude } = selectedFood.coordinate;
        mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.004, longitudeDelta: 0.004 }, 400);
        return;
      }
      if (selectedResource) {
        const { latitude, longitude } = selectedResource.coordinate;
        mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.004, longitudeDelta: 0.004 }, 400);
        return;
      }
      if (selectedEvent) {
        const { latitude, longitude } = selectedEvent.event.coordinate;
        mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.004, longitudeDelta: 0.004 }, 400);
        return;
      }
      const routeCoords = peopleOn
        ? visibleDays.flatMap((d) => d.route.stops.map((s) => s.building.coordinate))
        : stopCoords;
      const eventCoords = eventsOn ? events.entries.map((e) => e.event.coordinate) : [];
      const resourceCoords = resourcesOn ? resources.activeLocations.map((l) => l.coordinate) : [];
      const foodCoords = foodOn ? food.activeLocations.map((l) => l.coordinate) : [];
      const allCoords = [...routeCoords, ...eventCoords, ...resourceCoords, ...foodCoords];
      fit(allCoords.length ? allCoords : stopCoords);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    eventsOn,
    selectedEvent?.event.id,
    events.showAll,
    peopleOn,
    visibleKey,
    resourcesOn,
    selectedResource?.id,
    selectedBuildingDetails?.buildingId,
    resources.activeLocations.length,
    foodOn,
    selectedFood?.id,
    food.activeLocations.length,
  ]);

  // Botão "voltar" do Android: detalhe → lista → fecha a aba.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!focused) return false;
      if (selectedBuildingDetails) {
        resources.closeDetails();
        return true;
      }
      if (selectedResource) {
        resources.clearSelection();
        return true;
      }
      if (selectedFood) {
        food.clearSelection();
        return true;
      }
      if (selectedEvent) {
        events.clearSelection();
        return true;
      }
      if (sheetFilter) {
        remove(sheetFilter);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [
    focused,
    selectedBuildingDetails,
    selectedResource,
    selectedFood,
    selectedEvent,
    sheetFilter,
    remove,
    events.clearSelection,
    resources.closeDetails,
    resources.clearSelection,
    food.clearSelection,
  ]);

  // ---- Textos sobre o mapa ----
  let dayLabel = `Your day · Today · ${formatTime(now)}`;
  if (peopleOn) {
    const n = visibleDays.length;
    if (n === 0) dayLabel = `Today · ${formatTime(now)}`;
    else if (n === 1 && !visibleDays[0].person.isMe)
      dayLabel = `${visibleDays[0].person.shortName}'s day · Today · ${formatTime(now)}`;
    else if (n > 1) dayLabel = `Today · ${formatTime(now)} · ${n} people`;
  }

  const legendEntries: LegendEntry[] = peopleOn
    ? visibleDays.map((d) => ({ label: d.person.shortName, color: d.person.color }))
    : [{ label: 'You', color: colors.green }];
  legendEntries.push({ label: 'Next leg', color: colors.ink, thick: true });
  // Legenda: sem aba, ou acima da aba People (como no Figma). Escondida no detalhe de evento e recursos.
  const showLegend =
    !selectedEvent &&
    !selectedBuildingDetails &&
    !selectedFood &&
    (!sheetFilter || (sheetFilter === 'people' && sheetIndex > 0 && sheetIndex < 2));
  const legendBottom = sheetFilter ? sheetHeight + spacing.md : clearance + spacing.xs;

  return (
    <View style={styles.screen}>
      <View style={styles.mapArea} onLayout={(e) => setMapHeight(e.nativeEvent.layout.height)}>
        <CampusMap ref={mapRef} initialRegion={initialRegion} padding={mapPadding}>
          {peopleOn ? (
            <PeopleLayer state={people} />
          ) : (
            <DayRouteLayer route={userRoute} color={colors.green} highlightNextLeg />
          )}
          {eventsOn && <EventsLayer state={events} />}
          {resourcesOn && <ResourcesLayer state={resources} />}
          {foodOn && <FoodLayer state={food} />}
        </CampusMap>

        <MapTopBar
          topInset={insets.top}
          onAddFriend={() => setAddFriendOpen(true)}
          onOpenSchedule={onOpenSchedule}
          onOpenSettings={onOpenSettings}
          leftAccessory={
            selectedEvent ? <BackPill label="All events" onPress={events.clearSelection} /> : undefined
          }
        >
          {!selectedEvent && !selectedBuildingDetails && !selectedFood && <InfoChip label={dayLabel} />}
        </MapTopBar>

        {showLegend && (
          <View style={[styles.legend, { bottom: legendBottom }]} pointerEvents="none">
            <RouteLegend entries={legendEntries} />
          </View>
        )}

        {/* A aba vai até o fim da tela, por trás da barra voadora (o espaço coberto vem do contexto). */}
        <BottomClearanceContext.Provider value={clearance}>
        <FloatingBarContext.Provider value={floatingBar.control}>
        {sheetFilter === 'events' && (
          <EventsSheet state={events} onClose={() => remove('events')} onIndexChange={setSheetIndex} />
        )}
        {sheetFilter === 'resources' && (
          <ResourcesSheet
            state={resources}
            onClose={() => remove('resources')}
            onIndexChange={setSheetIndex}
          />
        )}
        {sheetFilter === 'food' && (
          <FoodSheet state={food} onClose={() => remove('food')} onIndexChange={setSheetIndex} />
        )}
        {sheetFilter === 'people' && (
          <PeopleSheet
            state={people}
            onClose={() => remove('people')}
            onIndexChange={setSheetIndex}
            onAddFriend={() => setAddFriendOpen(true)}
          />
        )}
        </FloatingBarContext.Provider>
        </BottomClearanceContext.Provider>

        {/* Barra de filtros "voadora" (como a do Instagram): flutua por cima do mapa e da aba. */}
        <Animated.View
          style={[styles.floatingBar, { bottom: barBottom }, floatingBar.animatedStyle]}
          pointerEvents="box-none"
          onLayout={(e) => setBarHeight(Math.round(e.nativeEvent.layout.height))}
        >
          <FilterBar active={active} focus={focus} onPress={press} onRemove={remove} />
        </Animated.View>
      </View>

      <AddFriendModal visible={addFriendOpen} onClose={() => setAddFriendOpen(false)} />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mapBackground },
  mapArea: { flex: 1 },
  legend: { position: 'absolute', left: 18, right: 18 },
  floatingBar: { position: 'absolute', left: 14, right: 14 },
});
