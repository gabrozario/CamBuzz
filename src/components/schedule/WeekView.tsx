import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ScheduleBlock } from '../../services/schedule/scheduleLogic';
import { fonts, useAppTheme, type AppColors } from '../../theme';
import type { ISODate } from '../../types';
import { addDays, dayOfMonth, formatMonthDay, WEEKDAYS } from '../../utils/dates';
import { toMinutes } from '../../utils/time';

interface Props {
  weekStart: ISODate; // segunda-feira
  today: ISODate;
  /** Blocos de cada dia, na ordem seg → dom. */
  days: ScheduleBlock[][];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onPressBlock: (block: ScheduleBlock) => void;
}

const HOUR_HEIGHT = 56;
const GUTTER = 30; // coluna dos horários (9a, 10a...)
const HEADER = 34; // linha dos dias (Mon, Tue...)

function hourLabel(h: number): string {
  const suffix = h >= 12 && h < 24 ? 'p' : 'a';
  return `${h % 12 === 0 ? 12 : h % 12}${suffix}`;
}

/** "CS 1332" -> "CS\n1332" (igual aos blocos do Figma). */
const blockLabel = (b: ScheduleBlock) => (b.type === 'course' ? b.label.replace(' ', '\n') : b.label);

/** Coloca blocos que se sobrepõem lado a lado (ex.: "Keep both" num conflito). */
function lanes(blocks: ScheduleBlock[]): { block: ScheduleBlock; lane: number; count: number }[] {
  const laneEnds: number[] = [];
  const placed = blocks.map((block) => {
    const start = toMinutes(block.start);
    let lane = laneEnds.findIndex((end) => end <= start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = toMinutes(block.end);
    return { block, lane };
  });
  return placed.map((p) => ({
    ...p,
    count: Math.max(
      ...placed
        .filter(
          (o) =>
            toMinutes(o.block.start) < toMinutes(p.block.end) && toMinutes(p.block.start) < toMinutes(o.block.end),
        )
        .map((o) => o.lane + 1),
    ),
  }));
}

/** Grade da semana (Figma "Schedule · Week View"): colunas seg–dom, horários à esquerda, fim de semana sombreado. */
export function WeekView({ weekStart, today, days, onPrevWeek, onNextWeek, onPressBlock }: Props) {
  const theme = useAppTheme();
  const { c } = theme;
  const styles = useMemo(() => makeStyles(c), [c]);
  const [width, setWidth] = useState(0);

  // Faixa de horas: pelo menos 9a–5p (como no Figma), aumenta se houver algo antes/depois.
  const all = days.flat();
  const firstHour = Math.min(9, ...all.map((b) => Math.floor(toMinutes(b.start) / 60)));
  const lastHour = Math.max(17, ...all.map((b) => Math.ceil(toMinutes(b.end) / 60)));
  const hours = Array.from({ length: lastHour - firstHour + 1 }, (_, i) => firstHour + i);
  const colWidth = width ? (width - GUTTER) / 7 : 0;
  const gridHeight = (lastHour - firstHour) * HOUR_HEIGHT;
  const y = (time: string) => ((toMinutes(time) - firstHour * 60) / 60) * HOUR_HEIGHT;

  return (
    <View>
      <View style={styles.weekRow}>
        <Text style={styles.sectionLabel}>
          WEEK OF {formatMonthDay(weekStart).toUpperCase()} – {formatMonthDay(addDays(weekStart, 6)).toUpperCase()}
        </Text>
        <View style={styles.arrows}>
          <Pressable onPress={onPrevWeek} hitSlop={8} style={styles.arrow} accessibilityLabel="Previous week">
            <ChevronLeft size={18} color={c.muted} strokeWidth={2} />
          </Pressable>
          <Pressable onPress={onNextWeek} hitSlop={8} style={styles.arrow} accessibilityLabel="Next week">
            <ChevronRight size={18} color={c.muted} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <View style={styles.card} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {/* Fundo cinza de sábado e domingo */}
        {colWidth > 0 && (
          <View
            style={[styles.weekend, { left: GUTTER + colWidth * 5, width: colWidth * 2, height: HEADER + gridHeight + 12 }]}
          />
        )}

        {/* Cabeçalho: Mon 16, Tue 17... (hoje em destaque) */}
        <View style={[styles.header, { paddingLeft: GUTTER }]}>
          {WEEKDAYS.map((d, i) => {
            const iso = addDays(weekStart, i);
            const isToday = iso === today;
            return (
              <View key={d} style={styles.dayHead}>
                <Text style={[styles.dayName, isToday && styles.today]}>{d}</Text>
                <Text style={[styles.dayNum, isToday && styles.today]}>{dayOfMonth(iso)}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: gridHeight + 12 }}>
          {/* Linhas das horas */}
          {hours.map((h) => (
            <View key={h} style={[styles.hourRow, { top: (h - firstHour) * HOUR_HEIGHT }]}>
              <Text style={styles.hourText}>{hourLabel(h)}</Text>
              <View style={styles.hourLine} />
            </View>
          ))}
          {/* Linhas verticais entre os dias */}
          {colWidth > 0 &&
            WEEKDAYS.map((d, i) => (
              <View key={d} style={[styles.vLine, { left: GUTTER + colWidth * i, height: gridHeight }]} />
            ))}

          {/* Blocos */}
          {colWidth > 0 &&
            days.map((blocks, dayIndex) =>
              lanes(blocks).map(({ block, lane, count }) => {
                const top = y(block.start);
                const height = Math.max(22, y(block.end) - top);
                const laneWidth = (colWidth - 4) / count;
                const textColor = theme.courseText(block.color);
                return (
                  <Pressable
                    key={block.key}
                    onPress={() => onPressBlock(block)}
                    style={[
                      styles.block,
                      {
                        top: top + 1,
                        height: height - 2,
                        left: GUTTER + colWidth * dayIndex + 2 + laneWidth * lane,
                        width: laneWidth - 2,
                        backgroundColor: theme.courseBg(block.color),
                        borderLeftColor: block.color,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${block.label}, ${block.start} to ${block.end}`}
                  >
                    <Text style={[styles.blockText, { color: textColor }]} numberOfLines={Math.max(1, Math.floor(height / 14))}>
                      {blockLabel(block)}
                    </Text>
                  </Pressable>
                );
              }),
            )}
        </View>
      </View>
    </View>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    weekRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionLabel: { fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 0.4, color: c.muted },
    arrows: { flexDirection: 'row', gap: 4 },
    arrow: { width: 32, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card },
    card: { backgroundColor: c.card, borderRadius: 20, overflow: 'hidden', paddingBottom: 4 },
    weekend: { position: 'absolute', top: 0, backgroundColor: c.weekend },
    header: { flexDirection: 'row', height: HEADER, alignItems: 'center' },
    dayHead: { flex: 1, alignItems: 'center' },
    dayName: { fontFamily: fonts.medium, fontSize: 11, color: c.muted },
    dayNum: { fontFamily: fonts.regular, fontSize: 10, color: c.placeholder },
    today: { color: c.accentSoftText, fontFamily: fonts.bold },
    hourRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start' },
    hourText: { width: GUTTER, fontFamily: fonts.regular, fontSize: 10, color: c.muted, paddingLeft: 4, marginTop: -6 },
    hourLine: { flex: 1, height: 1, backgroundColor: c.gridLine },
    vLine: { position: 'absolute', top: 0, width: 1, backgroundColor: c.gridLine },
    block: { position: 'absolute', borderRadius: 6, borderLeftWidth: 3, paddingHorizontal: 3, paddingVertical: 3, overflow: 'hidden' },
    blockText: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 13 },
  });
