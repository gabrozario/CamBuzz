import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Footprints, X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../theme';
import { formatTime } from '../../utils/time';
import { detourLabel, windowTitle } from './eventsOnRoute';
import type { EventEntry } from './useEventsFilter';

interface Props {
  entry: EventEntry;
  onClose: () => void;
}

/** Detalhe de um evento dentro da aba (tela "Event details" do Figma). */
export function EventDetails({ entry, onClose }: Props) {
  const { event, match } = entry;

  return (
    <BottomSheetScrollView contentContainerStyle={styles.content}>
      <Text style={styles.category}>{event.category}</Text>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{event.name}</Text>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
          <X size={24} color={colors.ink} strokeWidth={1.8} />
        </Pressable>
      </View>

      {/* O diferencial do Cambuzz: como esse evento cabe no seu dia */}
      {match ? (
        <View style={styles.fitCard}>
          <Footprints size={20} color={colors.green} strokeWidth={1.8} />
          <View style={styles.fitText}>
            <Text style={styles.fitTitle}>
              {detourLabel(match)} · up to {match.minutesAtEvent} min there
            </Text>
            <Text style={styles.fitSub}>
              {windowTitle(match.window)}
              {match.window.to ? ` · back in time for ${formatTime(match.window.end)}` : ''}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.fitCard, styles.fitCardOff]}>
          <Footprints size={20} color={colors.muted} strokeWidth={1.8} />
          <Text style={[styles.fitSub, styles.fitText]}>Not on your route today</Text>
        </View>
      )}

      <View style={styles.grid}>
        <View style={styles.cell}>
          <Text style={styles.label}>WHEN</Text>
          <Text style={styles.value}>Today · {formatTime(event.start)}</Text>
          <Text style={styles.sub}>Until {formatTime(event.end)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>WHERE</Text>
          <Text style={styles.value}>{event.locationName}</Text>
          <Text style={styles.sub}>{event.outdoor ? 'Outdoors' : 'Indoors'} · On campus</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>About this event</Text>
      <Text style={styles.about}>{event.description}</Text>
      <Text style={styles.org}>Hosted by {event.organization}</Text>

      <Text style={styles.footnote}>Sample event</Text>
    </BottomSheetScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  category: { fontFamily: fonts.medium, fontSize: 13, color: colors.gold },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginTop: 4 },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 26, color: colors.ink },
  fitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.greenSoft,
  },
  fitCardOff: { backgroundColor: colors.divider },
  fitText: { flex: 1, gap: 2 },
  fitTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.green },
  fitSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  grid: { flexDirection: 'row', gap: 16, marginTop: 20 },
  cell: { flex: 1, gap: 4 },
  label: { fontFamily: fonts.medium, fontSize: 11, color: colors.muted, letterSpacing: 0.5 },
  value: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 20 },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.ink },
  about: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted, marginTop: 8 },
  org: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink, marginTop: 12 },
  footnote: { fontFamily: fonts.regular, fontSize: 11, color: colors.subtle, marginTop: 24 },
});
