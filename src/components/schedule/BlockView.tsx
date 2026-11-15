import { CalendarHeart, Repeat, Users } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getBuilding } from '../../../data';
import { useFriends } from '../../services/friends/FriendsProvider';
import { EVENT_COLOR, formatEventTime, repeatLabel } from '../../services/schedule/scheduleLogic';
import { fonts, useAppTheme, type AppColors } from '../../theme';
import type { EnrolledCourse, PersonalEvent } from '../../types';
import { formatDate, formatDaysLong } from '../../utils/dates';
import { formatTime } from '../../utils/time';

interface Props {
  courses: EnrolledCourse[];
  events: PersonalEvent[];
  onPressCourse: (course: EnrolledCourse) => void;
  onPressEvent: (event: PersonalEvent) => void;
}

const STATUS_TEXT = { accepted: 'going', pending: 'invited', declined: "can't go" } as const;

/** Lista em cards (Figma "Schedule · Block View"): cursos e, embaixo, seus eventos. */
export function BlockView({ courses, events, onPressCourse, onPressEvent }: Props) {
  const theme = useAppTheme();
  const { c } = theme;
  const styles = useMemo(() => makeStyles(c), [c]);
  const { friends } = useFriends();
  const friendName = (id: string) => friends.find((f) => f.id === id)?.name.split(' ')[0] ?? 'Friend';

  return (
    <View>
      <Text style={styles.sectionLabel}>
        {courses.length} {courses.length === 1 ? 'COURSE' : 'COURSES'}
      </Text>
      {!courses.length && <Text style={styles.empty}>No courses yet. Tap + to add one.</Text>}
      {courses.map((course) => {
        const first = course.meetings[0];
        const building = getBuilding(first.buildingId);
        const accent = theme.courseText(course.color);
        return (
          <Pressable
            key={course.id}
            onPress={() => onPressCourse(course)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`${course.code}, ${course.title}`}
          >
            <View style={[styles.chip, { backgroundColor: theme.courseBg(course.color) }]}>
              <Text style={[styles.chipText, { color: accent }]}>{course.code}</Text>
            </View>
            <Text style={styles.title}>{course.title}</Text>
            <Text style={styles.meta} numberOfLines={2}>
              {course.instructor} · {building.name}
              {first.room ? ` room ${first.room}` : ''}
            </Text>
            {course.meetings.map((m, i) => (
              <View key={i} style={styles.meeting}>
                <Text style={styles.days}>
                  {formatDaysLong(m.days)}
                  {course.meetings.length > 1 ? ` · ${m.kind}` : ''}
                </Text>
                <Text style={[styles.time, { color: accent }]}>
                  {formatTime(m.start)} – {formatTime(m.end)}
                </Text>
              </View>
            ))}
          </Pressable>
        );
      })}

      <Text style={[styles.sectionLabel, styles.eventsLabel]}>
        {events.length} {events.length === 1 ? 'EVENT' : 'EVENTS'}
      </Text>
      {!events.length && <Text style={styles.empty}>No events yet. Tap + → Add Event.</Text>}
      {events.map((event) => {
        const accent = theme.courseText(EVENT_COLOR);
        return (
          <Pressable
            key={event.id}
            onPress={() => onPressEvent(event)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={event.name}
          >
            <View style={[styles.chip, styles.chipRow, { backgroundColor: theme.courseBg(EVENT_COLOR) }]}>
              {event.repeat === 'none' ? (
                <CalendarHeart size={14} color={accent} strokeWidth={2} />
              ) : (
                <Repeat size={14} color={accent} strokeWidth={2} />
              )}
              <Text style={[styles.chipText, { color: accent }]}>
                {event.repeat === 'none' ? 'Event' : repeatLabel(event.repeat)}
              </Text>
            </View>
            <Text style={styles.title}>{event.name}</Text>
            {!!event.location && (
              <Text style={styles.meta} numberOfLines={2}>
                {event.location}
              </Text>
            )}
            <View style={styles.meeting}>
              <Text style={styles.days}>
                {event.repeat === 'none' ? formatDate(event.date) : `Starting ${formatDate(event.date)}`}
              </Text>
              <Text style={[styles.time, { color: accent }]}>
                {formatEventTime(event)}
              </Text>
            </View>
            {(event.invites.length > 0 || event.invitedBy) && (
              <View style={styles.friendsRow}>
                <Users size={14} color={c.muted} strokeWidth={1.8} />
                <Text style={styles.friendsText} numberOfLines={2}>
                  {event.invitedBy
                    ? `Invited by ${event.invitedBy.name.split(' ')[0]}`
                    : event.invites.map((i) => `${friendName(i.friendId)} · ${STATUS_TEXT[i.status]}`).join('   ')}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    sectionLabel: { fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 0.4, color: c.muted, marginBottom: 12 },
    eventsLabel: { marginTop: 16 },
    empty: { fontFamily: fonts.regular, fontSize: 14, color: c.muted, marginBottom: 12 },
    card: {
      backgroundColor: c.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: 16,
      marginBottom: 12,
    },
    pressed: { opacity: 0.8 },
    chip: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, minWidth: 96 },
    chipRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    chipText: { fontFamily: fonts.semibold, fontSize: 13 },
    title: { fontFamily: fonts.semibold, fontSize: 19, color: c.text, marginTop: 12 },
    meta: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, marginTop: 4 },
    meeting: { marginTop: 12, gap: 4 },
    days: { fontFamily: fonts.regular, fontSize: 13, color: c.muted },
    time: { fontFamily: fonts.semibold, fontSize: 15 },
    friendsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
    friendsText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 12, color: c.muted },
  });
