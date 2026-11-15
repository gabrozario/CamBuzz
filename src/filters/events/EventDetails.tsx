import { ChevronLeft, Footprints, Users } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SheetScrollView } from '../../components/sheet/SheetScrollView';
import { fonts, radius, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import { formatTime } from '../../utils/time';
import { detourLabel, windowTitle } from './eventsOnRoute';
import { AddToScheduleButton } from './AddToScheduleButton';
import type { EventEntry } from './useEventsFilter';

interface HeaderProps {
  entry: EventEntry;
  /** Volta para a lista de eventos (não fecha o filtro). */
  onBack: () => void;
}

/**
 * Cabeçalho fixo do detalhe (vai no lugar do título da aba, via `customHeader`):
 * setinha "‹" no canto superior esquerdo + categoria + nome do evento e, à direita do nome,
 * "Add to schedule" (põe o evento na sua agenda de hoje).
 * Fica sempre visível e serve para arrastar a aba.
 */
export function EventDetailsHeader({ entry, onBack }: HeaderProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back to all events"
        >
          <ChevronLeft size={26} color={colors.ink} strokeWidth={1.8} />
        </Pressable>
        <Text style={styles.category}>{entry.event.category}</Text>
      </View>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={2}>
          {entry.event.name}
        </Text>
        <AddToScheduleButton event={entry.event} />
      </View>
    </View>
  );
}

/** Corpo rolável do detalhe de um evento (tela "Event details" do Figma). */
export function EventDetails({ entry }: { entry: EventEntry }) {
  const { colors, tint } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { event, match } = entry;

  return (
    <SheetScrollView contentContainerStyle={styles.content}>
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

      {/* Com o filtro People ligado: quem pode ir junto e quando vocês coincidem */}
      {entry.friends.map((f) => (
        <View key={f.person.id} style={[styles.fitCard, { backgroundColor: tint(f.person.color, 0.1) }]}>
          <Users size={20} color={f.person.color} strokeWidth={1.8} />
          <View style={styles.fitText}>
            <Text style={[styles.fitTitle, { color: f.person.color }]}>{f.person.shortName} can go too</Text>
            <Text style={styles.fitSub}>
              Together {formatTime(f.from)} – {formatTime(f.until)} · {f.minutesTogether} min
            </Text>
          </View>
        </View>
      ))}

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
    </SheetScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 8 },
  content: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 40 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: -6 },
  backBtn: { padding: 2 },
  category: { fontFamily: fonts.medium, fontSize: 13, color: colors.gold },
  // Nome à esquerda, "Add to schedule" à direita.
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 26, color: colors.ink },
  fitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
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
});
