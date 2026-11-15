import { CalendarDays, LayoutGrid, Map as MapIcon, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBuilding } from '../../data';
import { AddCourseModal } from '../components/schedule/AddCourseModal';
import { AddEventModal } from '../components/schedule/AddEventModal';
import { AddMenu } from '../components/schedule/AddMenu';
import { BlockView } from '../components/schedule/BlockView';
import { WeekView } from '../components/schedule/WeekView';
import { useToast } from '../components/ui/Toast';
import { blocksOnDate, EVENT_COLOR, repeatLabel, type ScheduleBlock } from '../services/schedule/scheduleLogic';
import { useSchedule } from '../services/schedule/ScheduleProvider';
import { fonts, useAppTheme, type AppColors } from '../theme';
import type { EnrolledCourse, ISODate, PersonalEvent } from '../types';
import { addDays, formatDate, formatDaysLong, startOfWeek, WEEKDAYS } from '../utils/dates';
import { formatTime } from '../utils/time';

interface Props {
  onOpenMap: () => void;
}

type ViewMode = 'week' | 'block';

const FAB_SIZE = 54;
const TAB_BAR_HEIGHT = 78;

/**
 * Tela "My schedule" (Figma "Schedule · Week View" / "Block View").
 * O "+" abre o menu Add Course / Add Event. Tocar num curso/evento permite tirar da agenda.
 */
export function ScheduleScreen({ onOpenMap }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { c } = theme;
  const styles = useMemo(() => makeStyles(c), [c]);
  const toast = useToast();
  const { schedule, today, removeCourse, removeEvent, skipDate } = useSchedule();

  const [mode, setMode] = useState<ViewMode>('week');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<'course' | 'event' | null>(null);

  const days = useMemo(
    () => WEEKDAYS.map((_, i) => blocksOnDate(schedule, addDays(weekStart, i))),
    [schedule, weekStart],
  );

  // ---- Tocar num curso/evento: detalhes + opções de tirar da agenda ----
  const openCourse = (course: EnrolledCourse, date?: ISODate) => {
    const lines = course.meetings.map((m) => {
      const b = getBuilding(m.buildingId);
      return `${m.kind} · ${formatDaysLong(m.days)} · ${formatTime(m.start)}–${formatTime(m.end)} · ${b.shortName}${m.room ? ` ${m.room}` : ''}`;
    });
    Alert.alert(`${course.code} · Section ${course.sectionId}`, `${course.title}\n${course.instructor}\n\n${lines.join('\n')}`, [
      { text: 'Close', style: 'cancel' },
      ...(date
        ? [
            {
              text: `Skip ${formatDate(date)}`,
              onPress: async () => {
                await skipDate('course', course.id, date);
                toast(`${course.code} hidden on ${formatDate(date)}`);
              },
            },
          ]
        : []),
      {
        text: 'Drop course',
        style: 'destructive' as const,
        onPress: async () => {
          await removeCourse(course.id);
          toast(`${course.code} removed from your schedule`);
        },
      },
    ]);
  };

  const openEvent = (event: PersonalEvent, date?: ISODate) => {
    const when =
      event.repeat === 'none' ? formatDate(event.date) : `${repeatLabel(event.repeat)} · from ${formatDate(event.date)}`;
    const where = event.location ? `\n${event.location}` : '';
    Alert.alert(event.name, `${when}\n${formatTime(event.start)}–${formatTime(event.end)}${where}`, [
      { text: 'Close', style: 'cancel' },
      ...(date && event.repeat !== 'none'
        ? [
            {
              text: `Skip ${formatDate(date)}`,
              onPress: async () => {
                await skipDate('event', event.id, date);
                toast(`${event.name} skipped on ${formatDate(date)}`);
              },
            },
          ]
        : []),
      {
        text: 'Delete event',
        style: 'destructive' as const,
        onPress: async () => {
          await removeEvent(event.id);
          toast(`${event.name} deleted`);
        },
      },
    ]);
  };

  const openBlock = (block: ScheduleBlock) => {
    if (block.type === 'course') {
      const course = schedule.courses.find((x) => x.id === block.sourceId);
      if (course) openCourse(course, block.date);
    } else {
      const event = schedule.events.find((x) => x.id === block.sourceId);
      if (event) openEvent(event, block.date);
    }
  };

  const footerBottom = TAB_BAR_HEIGHT + insets.bottom;
  const legend = [
    ...schedule.courses.map((x) => ({ label: x.code, color: x.color })),
    ...(schedule.events.length ? [{ label: 'Events', color: EVENT_COLOR }] : []),
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: footerBottom + FAB_SIZE + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={onOpenMap}
          style={({ pressed }) => [styles.mapLink, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Back to campus map"
        >
          <View style={styles.mapButton}>
            <MapIcon size={22} color={c.accentSoftText} strokeWidth={1.8} />
          </View>
          <Text style={styles.mapText}>Campus map</Text>
        </Pressable>

        <Text style={styles.title}>My schedule</Text>
        <Text style={styles.subtitle}>
          {mode === 'week' ? 'Your week, at a glance.' : 'Your classes, all in one place.'}
        </Text>

        {mode === 'week' ? (
          <WeekView
            weekStart={weekStart}
            today={today}
            days={days}
            onPrevWeek={() => setWeekStart((w) => addDays(w, -7))}
            onNextWeek={() => setWeekStart((w) => addDays(w, 7))}
            onPressBlock={openBlock}
          />
        ) : (
          <BlockView
            courses={schedule.courses}
            events={schedule.events}
            onPressCourse={(course) => openCourse(course)}
            onPressEvent={(event) => openEvent(event)}
          />
        )}
      </ScrollView>

      {/* "+" e legenda, logo acima da barra inferior */}
      <View style={[styles.footer, { bottom: footerBottom }]} pointerEvents="box-none">
        <Pressable
          onPress={() => setMenuOpen(true)}
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Add course or event"
        >
          <Plus size={28} color={c.onAccent} strokeWidth={2.2} />
        </Pressable>
        {mode === 'week' && (
          <View style={styles.legend} pointerEvents="none">
            {legend.map((l) => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendText}>{l.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Barra inferior: Week View / Block View */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom + 10 }]}>
        {(
          [
            { key: 'week', label: 'Week View', icon: CalendarDays },
            { key: 'block', label: 'Block View', icon: LayoutGrid },
          ] as const
        ).map(({ key, label, icon: Icon }) => {
          const selected = mode === key;
          return (
            <Pressable
              key={key}
              onPress={() => setMode(key)}
              style={[styles.tab, selected && styles.tabSelected]}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Icon size={24} color={selected ? c.accentSoftText : c.muted} strokeWidth={1.6} />
              <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <AddMenu
        visible={menuOpen}
        bottom={footerBottom + FAB_SIZE + 12}
        onClose={() => setMenuOpen(false)}
        onAddCourse={() => {
          setMenuOpen(false);
          setModal('course');
        }}
        onAddEvent={() => {
          setMenuOpen(false);
          setModal('event');
        }}
      />
      <AddCourseModal visible={modal === 'course'} onClose={() => setModal(null)} />
      <AddEventModal visible={modal === 'event'} onClose={() => setModal(null)} />
    </View>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: 18 },
    mapLink: { flexDirection: 'row', alignItems: 'center', gap: 14, alignSelf: 'flex-start' },
    mapButton: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mapText: { fontFamily: fonts.regular, fontSize: 15, color: c.muted },
    title: { fontFamily: fonts.bold, fontSize: 32, color: c.text, marginTop: 28, letterSpacing: -0.5 },
    subtitle: { fontFamily: fonts.regular, fontSize: 15, color: c.muted, marginTop: 6, marginBottom: 24 },
    footer: {
      position: 'absolute',
      left: 18,
      right: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingBottom: 12,
    },
    fab: {
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: 18,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 4,
    },
    legend: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 14,
      rowGap: 4,
      backgroundColor: c.page,
      borderRadius: 12,
      paddingVertical: 4,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 2 },
    legendText: { fontFamily: fonts.regular, fontSize: 12, color: c.muted },
    tabBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 6,
      backgroundColor: c.card,
      borderTopWidth: 1,
      borderTopColor: c.cardBorder,
    },
    tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 8, borderRadius: 18 },
    tabSelected: { backgroundColor: c.accentSoft },
    tabLabel: { fontFamily: fonts.medium, fontSize: 14, color: c.muted },
    tabLabelSelected: { fontFamily: fonts.semibold, color: c.accentSoftText },
  });
