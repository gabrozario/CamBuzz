import { CalendarDays, LayoutGrid, Map as MapIcon, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useClock } from '../hooks/useClock';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBuilding } from '../../data';
import { AddCourseModal } from '../components/schedule/AddCourseModal';
import { AddEventModal } from '../components/schedule/AddEventModal';
import { AddMenu } from '../components/schedule/AddMenu';
import { BlockView } from '../components/schedule/BlockView';
import { WeekView } from '../components/schedule/WeekView';
import { useToast } from '../components/ui/Toast';
import {
  blocksOnDate,
  formatEventTime,
  repeatLabel,
  type ScheduleBlock,
} from '../services/schedule/scheduleLogic';
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
/** Altura inicial da barra Week/Block (é medida de verdade no onLayout). */
const TAB_BAR_HEIGHT = 66;

/** "#1A2B3C" + 0.8 → "rgba(26, 43, 60, 0.8)" (cor meio transparente). */
function withAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
  const [barHeight, setBarHeight] = useState(TAB_BAR_HEIGHT); // medido no onLayout da barra

  // Hora do celular, ao vivo (a linha vermelha da Week View anda a cada minuto).
  const { minutes: nowMinutes } = useClock();

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
    Alert.alert(
      `${course.code} · Section ${course.sectionId}`,
      `${course.title}\n${course.instructor}\n\n${lines.join('\n')}`,
      [
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
      ],
    );
  };

  const openEvent = (event: PersonalEvent, date?: ISODate) => {
    const when =
      event.repeat === 'none'
        ? formatDate(event.date)
        : `${repeatLabel(event.repeat)} · from ${formatDate(event.date)}`;
    const where = event.location ? `\n${event.location}` : '';
    Alert.alert(event.name, `${when}\n${formatEventTime(event)}${where}`, [
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
      // Continuação depois da meia-noite → "Skip" pula a ocorrência do dia em que o evento começou.
      if (event) openEvent(event, block.startedOn);
    }
  };

  // Barra Week/Block "voadora" (como a do mapa): distância até a borda e onde começa o "+" (logo acima dela).
  const barBottom = Math.max(insets.bottom, 12) + 8;
  const footerBottom = barBottom + barHeight + 4;
  /** Topo do botão "+" (o rodapé tem 12 de espaço embaixo do botão) — o menu abre acima disso. */
  const fabTop = footerBottom + 12 + FAB_SIZE;

  return (
    <View style={styles.screen}>
      {/* Topo FIXO: botão "Campus Map" (voltar), título e subtítulo não rolam junto com a agenda. */}
      <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
        <Pressable
          onPress={onOpenMap}
          style={({ pressed }) => [styles.mapLink, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Back to campus map"
        >
          <View style={styles.mapButton}>
            <MapIcon size={22} color={c.accentSoftText} strokeWidth={1.8} />
          </View>
          <Text style={styles.mapText}>Campus Map</Text>
        </Pressable>

        <Text style={styles.title}>My Schedule</Text>
        <Text style={styles.subtitle}>
          {mode === 'week' ? 'Your week, at a glance.' : 'Your classes, all in one place.'}
        </Text>
      </View>

      {mode === 'week' ? (
        // Week View: semana + dias da semana ficam fixos; só a grade de horas rola (dentro da WeekView).
        <View style={[styles.content, styles.weekArea]}>
          <WeekView
            weekStart={weekStart}
            today={today}
            days={days}
            nowMinutes={nowMinutes}
            bottomPadding={fabTop + 12}
            onPrevWeek={() => setWeekStart((w) => addDays(w, -7))}
            onNextWeek={() => setWeekStart((w) => addDays(w, 7))}
            onPressBlock={openBlock}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: fabTop + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <BlockView
            courses={schedule.courses}
            events={schedule.events}
            onPressCourse={(course) => openCourse(course)}
            onPressEvent={(event) => openEvent(event)}
          />
        </ScrollView>
      )}

      {/* "+" logo acima da barra inferior */}
      <View style={[styles.footer, { bottom: footerBottom }]} pointerEvents="box-none">
        <Pressable
          onPress={() => setMenuOpen(true)}
          style={({ pressed }) => [styles.fab, { backgroundColor: withAlpha(c.accent, 0.78) }, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Add course or event"
        >
          <Plus size={28} color={c.onAccent} strokeWidth={2.2} />
        </Pressable>
      </View>

      {/* Barra Week View / Block View: flutuante e meio transparente (a agenda aparece por trás) */}
      <View
        style={[styles.tabBar, { bottom: barBottom, backgroundColor: theme.colors.floatingBar, borderColor: theme.colors.floatingBarBorder }]}
        onLayout={(e) => setBarHeight(Math.round(e.nativeEvent.layout.height))}
      >
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
              <Icon size={22} color={selected ? c.accentSoftText : c.muted} strokeWidth={1.6} />
              <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <AddMenu
        visible={menuOpen}
        bottom={fabTop}
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
    flex: { flex: 1 },
    weekArea: { flex: 1 },
    mapLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      alignSelf: 'flex-start',
    },
    mapButton: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mapText: { fontFamily: fonts.regular, fontSize: 15, color: c.muted },
    title: {
      fontFamily: fonts.bold,
      fontSize: 32,
      color: c.text,
      marginTop: 28,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontFamily: fonts.regular,
      fontSize: 15,
      color: c.muted,
      marginTop: 6,
      marginBottom: 24,
    },
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
      alignItems: 'center',
      justifyContent: 'center',
      // Sombra só no iPhone: no Android "elevation" + fundo transparente fica manchado.
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
        default: {},
      }),
    },
    // Flutuante (pílula) e meio transparente, igual à barra de filtros do mapa.
    tabBar: {
      position: 'absolute',
      left: 14,
      right: 14,
      flexDirection: 'row',
      gap: 6,
      padding: 6,
      borderRadius: 28,
      borderWidth: 1,
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
        default: {},
      }),
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
      paddingVertical: 6,
      borderRadius: 22,
    },
    tabSelected: { backgroundColor: c.accentSoft },
    tabLabel: { fontFamily: fonts.medium, fontSize: 13, color: c.muted },
    tabLabelSelected: { fontFamily: fonts.semibold, color: c.accentSoftText },
  });
