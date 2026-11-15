import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import type MapView from 'react-native-maps';
import type { Region } from 'react-native-maps';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackPill } from '../components/BackPill';
import { AddFriendModal } from '../components/friends/AddFriendModal';
import { CampusMap, GT_CAMPUS_BOUNDS, GT_REGION } from '../components/map/CampusMap';
import { DayRouteLayer } from '../components/map/DayRouteLayer';
import { FilterBar } from '../components/FilterBar';
import { MyRouteCard, type LegendEntry } from '../components/MyRouteCard';
import { MapTopBar } from '../components/MapTopBar';
import { FloatingBarContext, useFloatingBarController } from '../components/floatingBar';
import { MapViewportContext, type MapViewportValue } from '../components/map/mapViewport';
import { SearchPin } from '../components/map/SearchPin';
import { SearchScreen } from '../search/SearchScreen';
import type { SearchItem, SearchTarget } from '../search/searchIndex';
import { foodCategories, getBuilding, resourceCategories } from '../../data';
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
import { buildDayRoute, type DayRoute } from '../utils/route';
import { formatTime, nowTime } from '../utils/time';

/** Filtros que já têm aba (bottom sheet) implementada. */
const FILTERS_WITH_SHEET: FilterKey[] = ['events', 'people', 'resources', 'food'];

/** Array vazio fixo (um `[]` novo a cada render faria os useMemo recalcularem sempre). */
const NO_DAYS: PersonDay[] = [];

/** Altura mínima (dp) de mapa livre usada para enquadrar o caminho/pinos (evita zoom out exagerado). */
const MIN_FIT_HEIGHT = 240;

/** Margem (dp) ao dar zoom num grupo de pinos (grande, para os pinos ficarem bem separados). */
const ZOOM_PADDING = { top: 80, right: 80, bottom: 80, left: 80 };

/** Margem (dp) usada ao enquadrar pontos no mapa. */
// Só o necessário para os pinos (círculos de ~30 dp) não ficarem cortados na borda.
const FIT_PADDING = { top: 24, right: 28, bottom: 24, left: 28 };
/** Margem pequena ao enquadrar o campus: mostra o campus todo sem sobrar cidade em volta. */
const CAMPUS_PADDING = { top: 8, right: 8, bottom: 8, left: 8 };

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
  const { active, focus, press, remove, activate, focusFilter } = useActiveFilters();
  const [mapHeight, setMapHeight] = useState(0);
  const [mapWidth, setMapWidth] = useState(0);
  const [barHeight, setBarHeight] = useState(76); // medido no onLayout da barra
  const [sheetIndex, setSheetIndex] = useState(-1); // -1 = sem aba aberta
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  /** Alfinete de destaque da busca (prédio, aula, onde um amigo está). */
  const [searchPin, setSearchPin] = useState<{ coordinate: LatLng; label: string; color?: string } | null>(null);
  /** Busca atual (aparece na barra com um X) e qual filtro ela ligou (para desligar no X). */
  const [currentSearch, setCurrentSearch] = useState<{
    label: string;
    target: SearchTarget;
    activatedFilter: FilterKey | null;
  } | null>(null);

  const now = nowTime();
  // Suas paradas de hoje vêm da agenda (My schedule): aulas + eventos com prédio.
  const { todayClasses, schedule } = useSchedule();
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

  // ---- Filtro People ----
  // Pílula "My Route": o seu caminho do dia (começa DESLIGADO ao abrir o app).
  const [myRouteOn, setMyRouteOn] = useState(false);
  const people = usePeopleFilter(now, myRouteOn);
  const peopleOn = active.includes('people');
  const visibleDays = peopleOn ? people.visibleDays : NO_DAYS;
  // Quem tem caminho desenhado agora: amigos visíveis (Friends) e/ou você (My Route).
  const shownDays = peopleOn ? visibleDays : myRouteOn ? people.days.filter((d) => d.person.isMe) : NO_DAYS;

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

  // Ao desligar um filtro, ele "esquece" tudo (nada marcado, nada aberto).
  // Ao ligar de novo, começa do zero — ex.: os restaurantes só aparecem se você marcar de novo.
  useEffect(() => {
    if (!eventsOn) events.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsOn]);

  useEffect(() => {
    if (!resourcesOn) resources.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourcesOn]);

  useEffect(() => {
    if (!foodOn) food.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodOn]);

  useEffect(() => {
    if (!peopleOn) people.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peopleOn]);

  // Tocou num pino (evento, restaurante, recurso...) → a aba DESSE filtro vem para a frente,
  // já mostrando a descrição dele — mesmo que outro filtro estivesse em foco.
  useEffect(() => {
    if (selectedEvent) focusFilter('events');
  }, [selectedEvent?.event.id, focusFilter]);
  useEffect(() => {
    if (selectedFood) focusFilter('food');
  }, [selectedFood?.id, focusFilter]);
  useEffect(() => {
    if (selectedResource || selectedBuildingDetails) focusFilter('resources');
  }, [selectedResource?.id, selectedBuildingDetails?.buildingId, focusFilter]);

  // Mudou o filtro em foco → fecha a descrição aberta nos OUTROS (ex.: não fica "‹ All events" sobre a aba de comida).
  useEffect(() => {
    if (focus !== 'events') events.clearSelection();
    if (focus !== 'food') food.clearSelection();
    if (focus !== 'resources') resources.clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  // Espaço que a aba ocupa embaixo do mapa — o Google Maps centraliza o conteúdo acima dela.
  // Barra de filtros "voadora": distância até a borda de baixo e quanto ela cobre da tela.
  const barBottom = Math.max(insets.bottom, spacing.md) + spacing.sm;
  const clearance = barHeight + barBottom + spacing.sm;
  const sheetHeight = sheetHeightAt(sheetIndex, mapHeight, clearance);
  // Para ENQUADRAR o mapa, a aba em tela cheia conta como a do meio (senão não sobra mapa nenhum
  // e o Google Maps dá um zoom out gigante para "caber" o caminho).
  const sheetCover = sheetHeightAt(Math.min(sheetIndex, SHEET_MID), mapHeight, clearance);
  // Encolhe ao rolar uma lista para baixo; volta ao rolar para cima.
  const floatingBar = useFloatingBarController(barHeight, barBottom);

  // Trocou de filtro, abriu/fechou ou mudou a altura da aba → a barra volta ao tamanho normal.
  const expandBar = floatingBar.control.expand;
  useEffect(() => {
    expandBar();
  }, [sheetFilter, sheetIndex, expandBar]);
  const paddingTop = insets.top + 130; // barra de busca + chips
  // + espaço do cartão "My Route" (com legenda quando há caminho no mapa), que fica logo acima da barra/aba.
  const routeCardSpace = shownDays.length > 0 ? 84 : 52;
  const wantedBottom = (sheetIndex < 0 ? clearance : sheetCover) + routeCardSpace;
  // Sempre sobra pelo menos MIN_FIT_HEIGHT de mapa livre entre o topo e a aba para enquadrar.
  const paddingBottom = Math.max(0, Math.min(wantedBottom, mapHeight - paddingTop - MIN_FIT_HEIGHT));
  const mapPadding = useMemo(
    () => ({ top: paddingTop, bottom: paddingBottom, left: 16, right: 16 }),
    [paddingTop, paddingBottom],
  );

  // ---- Parte visível do mapa (para agrupar pinos colados) + zoom num grupo ----
  const [viewport, setViewport] = useState<Region | null>(null);
  const zoomTo = useCallback((coords: LatLng[]) => {
    if (coords.length) mapRef.current?.fitToCoordinates(coords, { edgePadding: ZOOM_PADDING, animated: true });
  }, []);
  const viewportValue = useMemo<MapViewportValue>(
    () => ({ viewport, width: mapWidth, height: mapHeight, zoomTo }),
    [viewport, mapWidth, mapHeight, zoomTo],
  );

  // ---- Câmera: enquadra o que importa conforme o estado ----
  const fit = useCallback((coords: LatLng[]) => {
    if (coords.length) mapRef.current?.fitToCoordinates(coords, { edgePadding: FIT_PADDING, animated: true });
  }, []);

  /** O campus inteiro da Georgia Tech (e nada além dele) — a visão de quando o app abre. */
  const fitCampus = useCallback((animated: boolean) => {
    mapRef.current?.fitToCoordinates(GT_CAMPUS_BOUNDS, { edgePadding: CAMPUS_PADDING, animated });
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
      // Enquadra SÓ o que é do filtro que você está vendo (ex.: restaurantes marcados), bem justo.
      // Sem nada marcado nele (ou sem filtro — a tela inicial), mostra o campus inteiro.
      const coordsByFilter: Record<FilterKey, LatLng[]> = {
        events: events.entries.map((e) => e.event.coordinate),
        resources: resources.activeLocations.map((l) => l.coordinate),
        food: food.activeLocations.map((l) => l.coordinate),
        people: visibleDays.flatMap((d) => d.route.stops.map((s) => s.building.coordinate)),
      };
      const focusCoords = focus ? coordsByFilter[focus] : [];
      if (focusCoords.length) fit(focusCoords);
      else fitCampus(true);
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
    focus,
    myRouteOn,
  ]);

  // ---- Busca ----
  /** Onde cada amigo está agora (aparece embaixo do nome nos resultados). */
  const friendStatus = useMemo(
    () => Object.fromEntries(people.days.filter((d) => !d.person.isMe).map((d) => [d.person.id, d.status])),
    [people.days],
  );

  /** Move a câmera até um ponto (depois do enquadramento automático, que roda ~300 ms após mudar filtro). */
  const flyTo = useCallback((coordinate: LatLng, delay = 450) => {
    setTimeout(() => {
      mapRef.current?.animateToRegion({ ...coordinate, latitudeDelta: 0.004, longitudeDelta: 0.004 }, 500);
    }, delay);
  }, []);

  /** Tocou num resultado: liga o filtro certo, abre a descrição e/ou leva a câmera até lá. */
  const onSearchSelect = (target: SearchTarget, item: SearchItem) => {
    setSearchOpen(false);
    setSearchPin(null);
    // Lembra a busca (aparece na barra) e se ela ligou um filtro que estava desligado.
    const filterOf: Partial<Record<SearchTarget['type'], FilterKey>> = {
      resource: 'resources',
      food: 'food',
      event: 'events',
      friend: 'people',
    };
    const filter = target.type === 'category' ? target.filter : filterOf[target.type];
    setCurrentSearch({
      label: item.title,
      target,
      activatedFilter: filter && !active.includes(filter) ? filter : null,
    });
    switch (target.type) {
      case 'resource': {
        const loc = resourceCategories.flatMap((c) => c.locations).find((l) => l.id === target.locationId);
        if (!loc) return;
        activate('resources');
        resources.showLocation(loc); // só o alfinete dele; a câmera vai até ele (efeito da câmera)
        return;
      }
      case 'food': {
        const loc = foodCategories.flatMap((c) => c.locations).find((l) => l.id === target.locationId);
        if (!loc) return;
        activate('food');
        food.openOnly(loc); // só o alfinete dele ("Return" volta com nada marcado)
        return;
      }
      case 'event':
        activate('events');
        events.openEvent(target.eventId);
        return;
      case 'friend': {
        activate('people');
        people.show(target.friendId);
        // Onde ele deve estar agora: aula atual → próxima → última do dia.
        const day = people.days.find((d) => d.person.id === target.friendId);
        const stops = day?.route.stops ?? [];
        const stop =
          stops.find((s) => s.status === 'now') ?? stops.find((s) => s.status === 'upcoming') ?? stops[stops.length - 1];
        if (day && stop) {
          const when = stop.status === 'now' ? 'now' : stop.status === 'upcoming' ? `at ${formatTime(stop.session.start)}` : 'last class';
          setSearchPin({
            coordinate: stop.building.coordinate,
            label: `${day.person.shortName} · ${stop.building.shortName} ${when}`,
            color: day.person.color,
          });
          flyTo(stop.building.coordinate, 650);
        }
        return;
      }
      case 'course': {
        const course = schedule.courses.find((c) => c.id === target.courseId);
        if (!course) return;
        const m = course.meetings[0];
        const b = getBuilding(m.buildingId);
        setSearchPin({ coordinate: b.coordinate, label: `${course.code} · ${b.shortName}${m.room ? ` ${m.room}` : ''}`, color: course.color });
        flyTo(b.coordinate, 50);
        return;
      }
      case 'building': {
        const b = getBuilding(target.buildingId);
        setSearchPin({ coordinate: b.coordinate, label: b.name });
        flyTo(b.coordinate, 50);
        return;
      }
      case 'category':
        activate(target.filter);
        if (target.filter === 'food' && target.categoryId) food.showCategory(target.categoryId);
        if (target.filter === 'resources' && target.categoryId) resources.showCategory(target.categoryId);
        return;
    }
  };

  /** X da busca na barra: tira o alfinete/descrição do resultado (e desliga o filtro se foi a busca que ligou). */
  const clearSearch = () => {
    if (!currentSearch) return;
    const { target, activatedFilter } = currentSearch;
    setCurrentSearch(null);
    setSearchPin(null);
    if (target.type === 'food') food.clearSelection();
    if (target.type === 'resource') resources.clearSelection();
    if (target.type === 'event') events.clearSelection();
    if (activatedFilter && active.includes(activatedFilter)) remove(activatedFilter);
  };

  // A busca sai da barra sozinha quando o resultado não está mais na tela
  // (tocou em "‹ Return", fechou o filtro, abriu outra coisa...).
  useEffect(() => {
    if (!currentSearch) return;
    const t = currentSearch.target;
    const stillShowing =
      t.type === 'food'
        ? selectedFood?.id === t.locationId
        : t.type === 'resource'
          ? selectedResource?.id === t.locationId
          : t.type === 'event'
            ? selectedEvent?.event.id === t.eventId
            : t.type === 'category'
              ? active.includes(t.filter)
              : !!searchPin; // prédio, aula, amigo
    if (!stillShowing) setCurrentSearch(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFood?.id, selectedResource?.id, selectedEvent?.event.id, searchPin, active]);

  // Mexeu nos filtros pela barra → tira o alfinete da busca.
  const onBarPress = useCallback(
    (key: FilterKey) => {
      setSearchPin(null);
      press(key);
    },
    [press],
  );
  const onBarRemove = useCallback(
    (key: FilterKey) => {
      setSearchPin(null);
      remove(key);
    },
    [remove],
  );

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

  // ---- Cartão "My Route" + legenda (canto inferior esquerdo) ----
  const inDetail = !!(selectedEvent || selectedBuildingDetails || selectedResource || selectedFood);
  // Legenda só quando há caminho no mapa (e não no detalhe de um lugar, para não poluir).
  const legendEntries: LegendEntry[] =
    shownDays.length > 0 && !inDetail
      ? [
          ...shownDays.map((d) => ({ label: d.person.shortName, color: d.person.color })),
          { label: 'Next leg', color: colors.ink, thick: true },
        ]
      : [];
  // Some com a aba em tela cheia; senão fica logo acima da aba (ou da barra de filtros).
  const showRouteCard = !(sheetFilter && sheetIndex >= 2);
  const routeCardBottom = sheetFilter ? sheetHeight + spacing.md : clearance + spacing.xs;

  return (
    <View style={styles.screen}>
      <View
        style={styles.mapArea}
        onLayout={(e) => {
          setMapHeight(e.nativeEvent.layout.height);
          setMapWidth(e.nativeEvent.layout.width);
        }}
      >
        <MapViewportContext.Provider value={viewportValue}>
        {/* Abre já no campus inteiro (initialRegion) e reenquadra certinho quando o mapa termina de carregar. */}
        <CampusMap
          ref={mapRef}
          initialRegion={GT_REGION}
          onMapReady={() => fitCampus(false)}
          padding={mapPadding}
          onRegionChangeComplete={setViewport}
        >
          {peopleOn ? (
            <PeopleLayer state={people} />
          ) : (
            myRouteOn && <DayRouteLayer route={userRoute} color={colors.green} highlightNextLeg isMe />
          )}
          {eventsOn && <EventsLayer state={events} />}
          {resourcesOn && <ResourcesLayer state={resources} />}
          {foodOn && <FoodLayer state={food} />}
          {searchPin && (
            <SearchPin
              coordinate={searchPin.coordinate}
              label={searchPin.label}
              color={searchPin.color}
              onPress={() => setSearchPin(null)}
            />
          )}
        </CampusMap>
        </MapViewportContext.Provider>

        <MapTopBar
          topInset={insets.top}
          onAddFriend={() => setAddFriendOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          searchLabel={currentSearch?.label}
          onClearSearch={clearSearch}
          onOpenSchedule={onOpenSchedule}
          onOpenSettings={onOpenSettings}
          leftAccessory={
            selectedEvent ? <BackPill label="All events" onPress={events.clearSelection} /> : undefined
          }
        >
        </MapTopBar>

        {showRouteCard && (
          <View style={[styles.routeCard, { bottom: routeCardBottom }]} pointerEvents="box-none">
            <MyRouteCard value={myRouteOn} onChange={setMyRouteOn} entries={legendEntries} />
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
          <FilterBar active={active} focus={focus} onPress={onBarPress} onRemove={onBarRemove} />
        </Animated.View>
      </View>

      <AddFriendModal visible={addFriendOpen} onClose={() => setAddFriendOpen(false)} />

      <SearchScreen
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={onSearchSelect}
        friendStatus={friendStatus}
        now={now}
        initialQuery={currentSearch?.label}
      />
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mapBackground },
  mapArea: { flex: 1 },
  routeCard: { position: 'absolute', left: 14, right: 14 },
  floatingBar: { position: 'absolute', left: 14, right: 14 },
});
