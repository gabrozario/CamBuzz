import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import type MapView from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { schedule } from '../../data';
import { BackPill } from '../components/BackPill';
import { AddFriendModal } from '../components/friends/AddFriendModal';
import { CampusMap } from '../components/map/CampusMap';
import { DayRouteLayer } from '../components/map/DayRouteLayer';
import { FilterBar } from '../components/FilterBar';
import { InfoChip } from '../components/InfoChip';
import { MapTopBar } from '../components/MapTopBar';
import { RouteLegend, type LegendEntry } from '../components/RouteLegend';
import { SHEET_COLLAPSED_HEIGHT, SHEET_HALF } from '../components/sheet/FilterSheet';
import { EventsLayer } from '../filters/events/EventsLayer';
import { EventsSheet } from '../filters/events/EventsSheet';
import type { Companion } from '../filters/events/eventsWithFriends';
import { useEventsFilter } from '../filters/events/useEventsFilter';
import type { PersonDay } from '../filters/people/peopleDay';
import { PeopleLayer } from '../filters/people/PeopleLayer';
import { PeopleSheet } from '../filters/people/PeopleSheet';
import { usePeopleFilter } from '../filters/people/usePeopleFilter';
import { useActiveFilters } from '../hooks/useActiveFilters';
import { colors, spacing } from '../theme';
import type { FilterKey, LatLng } from '../types';
import { buildDayRoute, regionFor } from '../utils/route';
import { formatTime, nowTime } from '../utils/time';

/** Filtros que já têm aba (bottom sheet) implementada. */
const FILTERS_WITH_SHEET: FilterKey[] = ['events', 'people'];

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
export function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { active, toggle } = useActiveFilters();
  const [focus, setFocus] = useState<FilterKey | null>(null);
  const [mapHeight, setMapHeight] = useState(0);
  const [sheetIndex, setSheetIndex] = useState(-1); // -1 = sem aba aberta
  const [addFriendOpen, setAddFriendOpen] = useState(false);

  const now = nowTime();
  const userRoute = useMemo(() => buildDayRoute(schedule.classes, now), [now]);
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

  // ---- Qual aba aparece ----
  const lastWithSheet = [...active].reverse().find((k) => FILTERS_WITH_SHEET.includes(k));
  const sheetFilter = focus && active.includes(focus) ? focus : lastWithSheet;

  /** Toque na barra: liga/desliga; se o filtro já está ligado mas a aba dele não está à frente, só traz a aba. */
  const onFilterPress = useCallback(
    (key: FilterKey) => {
      if (active.includes(key) && sheetFilter !== key && FILTERS_WITH_SHEET.includes(key)) {
        setFocus(key);
        return;
      }
      if (!active.includes(key)) setFocus(key);
      toggle(key);
    },
    [active, sheetFilter, toggle],
  );

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
  const paddingBottom = sheetIndex < 0 ? 90 : sheetHeight + (sheetFilter === 'people' ? 80 : 0);
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
      if (selectedEvent) {
        const { latitude, longitude } = selectedEvent.event.coordinate;
        mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.004, longitudeDelta: 0.004 }, 400);
        return;
      }
      const routeCoords = peopleOn
        ? visibleDays.flatMap((d) => d.route.stops.map((s) => s.building.coordinate))
        : stopCoords;
      const eventCoords = eventsOn ? events.entries.map((e) => e.event.coordinate) : [];
      fit([...routeCoords, ...eventCoords].length ? [...routeCoords, ...eventCoords] : stopCoords);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsOn, selectedEvent?.event.id, events.showAll, peopleOn, visibleKey]);

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
  // Legenda: sem aba, ou acima da aba People (como no Figma). Escondida no detalhe de evento.
  const showLegend = !selectedEvent && (!sheetFilter || (sheetFilter === 'people' && sheetIndex > 0 && sheetIndex < 2));
  const legendBottom = sheetFilter ? sheetHeight + spacing.md : spacing.md;

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
        </CampusMap>

        <MapTopBar
          topInset={insets.top}
          onAddFriend={() => setAddFriendOpen(true)}
          // Próxima etapa: telas "My schedule" e "Settings" (já estão no /figma-designs).
          onOpenSchedule={undefined}
          onOpenSettings={undefined}
          leftAccessory={
            selectedEvent ? <BackPill label="All events" onPress={events.clearSelection} /> : undefined
          }
        >
          {!selectedEvent && <InfoChip label={dayLabel} />}
        </MapTopBar>

        {showLegend && (
          <View style={[styles.legend, { bottom: legendBottom }]} pointerEvents="none">
            <RouteLegend entries={legendEntries} />
          </View>
        )}

        {/* A aba fica dentro da área do mapa, então sobe até a barra de filtros sem cobri-la. */}
        {sheetFilter === 'events' && (
          <EventsSheet state={events} onClose={() => toggle('events')} onIndexChange={setSheetIndex} />
        )}
        {sheetFilter === 'people' && (
          <PeopleSheet
            state={people}
            onClose={() => toggle('people')}
            onIndexChange={setSheetIndex}
            onAddFriend={() => setAddFriendOpen(true)}
          />
        )}
      </View>

      <FilterBar active={active} onPress={onFilterPress} bottomInset={insets.bottom} />

      <AddFriendModal visible={addFriendOpen} onClose={() => setAddFriendOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mapBackground },
  mapArea: { flex: 1 },
  legend: { position: 'absolute', left: 18, right: 18 },
});
