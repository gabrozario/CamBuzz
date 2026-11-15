import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import { formatTime } from '../../utils/time';
import { detourLabel } from './eventsOnRoute';
import { friendsLabel } from './eventsWithFriends';
import type { EventEntry } from './useEventsFilter';

interface Props {
  entry: EventEntry;
  onPress: () => void;
  showDivider: boolean;
}

/** Linha da lista de eventos: horário dourado à esquerda, nome/local/categoria, seta à direita. */
export function EventListItem({ entry, onPress, showDivider }: Props) {
  const { colors, legible } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { event, match, number } = entry;
  const [time, ampm] = formatTime(event.start).split(' ');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${number}. ${event.name}, ${formatTime(event.start)}, ${event.locationName}`}
    >
      <View style={styles.timeCol}>
        <Text style={styles.time}>{time}</Text>
        <Text style={styles.ampm}>{ampm}</Text>
      </View>

      <View style={[styles.body, showDivider && styles.divider]}>
        <View style={styles.textCol}>
          <View style={styles.titleRow}>
            <View style={[styles.badge, entry.dim && styles.badgeOff]}>
              <Text style={styles.badgeText}>{number}</Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {event.name}
            </Text>
          </View>
          <Text style={styles.location} numberOfLines={1}>
            {event.locationName}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            <Text style={styles.category}>{event.category}</Text>
            {match && <Text style={styles.fit}>{`  ·  ${detourLabel(match)}`}</Text>}
            {entry.ended && <Text style={styles.ended}>{'  ·  Ended'}</Text>}
          </Text>
          {entry.friends.length > 0 && (
            <View style={styles.friendsRow}>
              <View style={styles.dots}>
                {entry.friends.map((f) => (
                  <View key={f.person.id} style={[styles.dot, { backgroundColor: f.person.color }]} />
                ))}
              </View>
              <Text style={[styles.friendsText, { color: legible(entry.friends[0].person.color) }]} numberOfLines={1}>
                {friendsLabel(entry.friends)}
              </Text>
            </View>
          )}
        </View>
        <ChevronRight size={22} color={colors.muted} strokeWidth={1.8} />
      </View>
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 24 },
  pressed: { backgroundColor: colors.divider },
  timeCol: { width: 62, paddingTop: 16 },
  time: { fontFamily: fonts.semibold, fontSize: 17, color: colors.gold },
  ampm: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted, marginTop: 2 },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 8 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  textCol: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOff: { backgroundColor: colors.muted },
  badgeText: { fontFamily: fonts.semibold, fontSize: 10, color: colors.onInk },
  title: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  location: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  meta: { marginTop: 2 },
  category: { fontFamily: fonts.medium, fontSize: 12, color: colors.gold },
  ended: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  fit: { fontFamily: fonts.medium, fontSize: 12, color: colors.green },
  friendsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dots: { flexDirection: 'row' },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: colors.surface, marginRight: -3 },
  friendsText: { flex: 1, fontFamily: fonts.semibold, fontSize: 12, marginLeft: 3 },
});
