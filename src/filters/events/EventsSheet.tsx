import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FilterSheet, SHEET_MID, type FilterSheetHandle } from '../../components/sheet/FilterSheet';
import { SheetScrollView } from '../../components/sheet/SheetScrollView';
import { fonts, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import { EventDetails, EventDetailsHeader } from './EventDetails';
import { EventListItem } from './EventListItem';
import type { EventsFilterState } from './useEventsFilter';

interface Props {
  state: EventsFilterState;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

/** A aba do filtro de Eventos: lista agrupada por janela livre, ou o detalhe de um evento. */
export function EventsSheet({ state, onClose, onIndexChange }: Props) {
  const styles = useThemedStyles(makeStyles);
  const sheetRef = useRef<FilterSheetHandle>(null);
  const {
    sections,
    selected,
    select,
    showAll,
    setShowAll,
    matchCount,
    upcomingCount,
    withFriendsCount,
    hasCompanions,
    noPlanToday,
  } = state;

  // Ao escolher um evento (na lista ou no pino do mapa), a aba vai para a altura do meio (30%).
  useEffect(() => {
    if (selected) sheetRef.current?.snapTo(SHEET_MID);
  }, [selected?.event.id]);

  const base = noPlanToday
    ? 'Showing all events of the day'
    : showAll
      ? `Today · ${upcomingCount} events`
      : `Today · ${matchCount} on your route`;
  // Com People ligado: quantos dá pra ir com amigos.
  const subtitle = hasCompanions ? `${base} · ${withFriendsCount} with friends` : base;

  return (
    <FilterSheet
      ref={sheetRef}
      title="Events"
      subtitle={subtitle}
      note="Sample events"
      customHeader={selected ? <EventDetailsHeader entry={selected} onBack={state.clearSelection} /> : undefined}
      onClose={onClose}
      onIndexChange={onIndexChange}
    >
      {selected ? (
        <EventDetails entry={selected} />
      ) : (
        <SheetScrollView contentContainerStyle={styles.content}>
          {sections.length === 0 && (
            <Text style={styles.empty}>
              {noPlanToday ? 'No events today.' : 'No events fit between your classes right now.'}
            </Text>
          )}

          {sections.map((section) => (
            <View key={section.id}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.subtitle && <Text style={styles.sectionSub}>{section.subtitle}</Text>}
              </View>
              {section.entries.map((entry, i) => (
                <EventListItem
                  key={entry.event.id}
                  entry={entry}
                  onPress={() => select(entry.event.id)}
                  showDivider={i < section.entries.length - 1}
                />
              ))}
            </View>
          ))}

          {/* Sem agenda hoje não existe "no meu caminho" — já mostra tudo. */}
          {!noPlanToday && (
            <Pressable onPress={() => setShowAll(!showAll)} style={styles.toggle} accessibilityRole="button">
              <Text style={styles.toggleText}>
                {showAll ? 'Only show events on my route' : `Show all ${upcomingCount} events today`}
              </Text>
            </Pressable>
          )}
        </SheetScrollView>
      )}
    </FilterSheet>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  content: { paddingBottom: 32 },
  sectionHeader: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 4,
    gap: 2,
  },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 13, color: colors.green },
  sectionSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, paddingHorizontal: 24, paddingTop: 16 },
  toggle: { marginTop: 16, marginHorizontal: 24, paddingVertical: 12, alignItems: 'center' },
  toggleText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, textDecorationLine: 'underline' },
});
