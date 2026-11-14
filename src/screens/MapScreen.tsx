import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { schedule } from '../../data';
import { CampusMap } from '../components/map/CampusMap';
import { DayRouteLayer } from '../components/map/DayRouteLayer';
import { FilterBar } from '../components/FilterBar';
import { InfoChip } from '../components/InfoChip';
import { MapTopBar } from '../components/MapTopBar';
import { RouteLegend } from '../components/RouteLegend';
import { useActiveFilters } from '../hooks/useActiveFilters';
import { colors, spacing } from '../theme';
import { buildDayRoute, regionFor } from '../utils/route';
import { formatTime, nowTime } from '../utils/time';

/**
 * Tela principal: mapa da GT com o caminho do dia + barra de filtros.
 *
 * Próximas etapas (não implementadas ainda):
 * - quando `activeFilters` tiver 'events' / 'people', desenhar as camadas desses
 *   filtros dentro do <CampusMap> e abrir o bottom sheet (@gorhom/bottom-sheet).
 */
export function MapScreen() {
  const insets = useSafeAreaInsets();
  const { active, toggle } = useActiveFilters();

  const now = nowTime();
  const userRoute = useMemo(() => buildDayRoute(schedule.classes, now), [now]);
  const initialRegion = useMemo(
    () => regionFor(userRoute.stops.map((s) => s.building.coordinate)),
    [userRoute],
  );

  return (
    <View style={styles.screen}>
      <View style={styles.mapArea}>
        <CampusMap
          initialRegion={initialRegion}
          // Reserva espaço para a barra do topo e a legenda, para o caminho caber na área visível.
          padding={{ top: insets.top + 130, bottom: 90, left: 16, right: 16 }}
        >
          <DayRouteLayer route={userRoute} color={colors.green} highlightNextLeg />
          {/* Aqui entram as camadas dos filtros (EventsLayer, FriendsLayer...) */}
        </CampusMap>

        <MapTopBar topInset={insets.top}>
          <InfoChip label={`Your day · Today · ${formatTime(now)}`} />
        </MapTopBar>

        <View style={styles.legend} pointerEvents="none">
          <RouteLegend
            entries={[
              { label: 'You', color: colors.green },
              { label: 'Next leg', color: colors.ink, thick: true },
            ]}
          />
        </View>
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
