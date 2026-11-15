import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
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
  /** Agora, em minutos desde a meia-noite (relógio do celular) — posição da linha vermelha. */
  nowMinutes: number;
  /** Espaço livre no fim da grade (para as últimas horas não ficarem atrás do botão "+"). */
  bottomPadding?: number;
}

const HOUR_HEIGHT = 56;
const GUTTER = 30; // coluna dos horários (9a, 10a...)
const HEADER = 34; // linha dos dias (Mon, Tue...)
const NOW_DOT = 10; // bolinha vermelha no começo da linha do "agora"
const PAST_OPACITY = 0.45; // blocos que já terminaram ficam "apagados"
const TOP_PAD = 8; // espaço acima da linha das 12a (para o texto "12a" não ser cortado)
/** Ao abrir, a grade começa 1 hora antes da linha vermelha (ex.: 2:00 PM → começa na linha de 1:00 PM). */
const LEAD_MINUTES = 60;
/** Se hoje não está na semana mostrada, a grade abre nas 7 AM. */
const DEFAULT_TOP_MINUTES = 7 * 60;

// Gesto de trocar semana
const SWIPE_ACTIVATE = 20; // px na horizontal até o gesto começar
const SWIPE_FAIL_Y = 15; // px na vertical antes disso → é rolagem, não troca de semana
const SWIPE_DISTANCE = 70; // arrastou mais que isso → troca
const SWIPE_VELOCITY = 600; // ou foi um "peteleco" rápido (px/s) → troca
const SLIDE_MS = 160; // duração da animação de saída/entrada

/** A grade mostra o dia INTEIRO: de 12 AM até a meia-noite seguinte, tenha aula ou não. */
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 12a, 1a … 11p
const GRID_HEIGHT = 24 * HOUR_HEIGHT;
const yOf = (minutes: number) => (minutes / 60) * HOUR_HEIGHT;
const y = (time: string) => yOf(toMinutes(time)); // "24:00" = fim da grade

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
          (o) => toMinutes(o.block.start) < toMinutes(p.block.end) && toMinutes(p.block.start) < toMinutes(o.block.end),
        )
        .map((o) => o.lane + 1),
    ),
  }));
}

/**
 * Grade da semana (Figma "Schedule · Week View"): colunas seg–dom, horários à esquerda, fim de semana sombreado.
 * Extras: o dia inteiro (12 AM–12 AM), linha vermelha do "agora" na coluna de hoje e blocos passados apagados.
 */
export function WeekView({
  weekStart,
  today,
  days,
  onPrevWeek,
  onNextWeek,
  onPressBlock,
  nowMinutes,
  bottomPadding = 0,
}: Props) {
  const theme = useAppTheme();
  const { c } = theme;
  const styles = useMemo(() => makeStyles(c), [c]);
  const [width, setWidth] = useState(0);

  const colWidth = width ? (width - GUTTER) / 7 : 0;
  // Coluna de hoje nesta semana (-1 = hoje não está nesta semana → sem linha vermelha).
  const todayIndex = WEEKDAYS.findIndex((_, i) => addDays(weekStart, i) === today);
  const nowY = yOf(nowMinutes);

  // ---- Posição inicial da grade (calculada uma vez, quando a Week View abre) ----
  const [initialY] = useState(() =>
    Math.max(0, yOf(todayIndex >= 0 ? nowMinutes - LEAD_MINUTES : DEFAULT_TOP_MINUTES)),
  );
  const scrollRef = useRef<ScrollViewInstance>(null);
  const didInitialScroll = useRef(false);
  /** No Android o contentOffset inicial nem sempre funciona: rolamos assim que a grade é medida. */
  const scrollToInitial = (contentHeight: number) => {
    if (didInitialScroll.current || contentHeight < GRID_HEIGHT) return;
    didInitialScroll.current = true;
    scrollRef.current?.scrollTo({ y: initialY, animated: false });
  };

  // ---- Arrastar para os lados = trocar de semana ----
  // Dedo da esquerda → direita: semana anterior. Da direita → esquerda: próxima semana.
  // Só "pega" o gesto se o dedo andar mais na horizontal (senão é a rolagem vertical da grade).
  const translateX = useSharedValue(0);
  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const changeWeek = (direction: -1 | 1) => {
    const distance = width || 400;
    // 1) o card sai para o lado do gesto; 2) troca a semana; 3) a nova semana entra pelo outro lado.
    translateX.value = withTiming(-direction * distance, { duration: SLIDE_MS });
    setTimeout(() => {
      if (direction === 1) onNextWeek();
      else onPrevWeek();
      translateX.value = direction * distance;
      translateX.value = withTiming(0, { duration: SLIDE_MS });
    }, SLIDE_MS);
  };
  const swipe = usePanGesture({
    runOnJS: true, // callbacks em JS puro (mais simples; nada pesado acontece aqui)
    activeOffsetX: [-SWIPE_ACTIVATE, SWIPE_ACTIVATE],
    failOffsetY: [-SWIPE_FAIL_Y, SWIPE_FAIL_Y],
    onUpdate: (e) => {
      translateX.value = e.translationX;
    },
    onDeactivate: (e) => {
      const far = Math.abs(e.translationX) > SWIPE_DISTANCE;
      const fast = Math.abs(e.velocityX) > SWIPE_VELOCITY;
      if (!e.canceled && (far || fast)) changeWeek(e.translationX < 0 ? 1 : -1);
      else translateX.value = withTiming(0, { duration: SLIDE_MS }); // pouco arrasto: volta para o lugar
    },
  });

  /** Já terminou? Usa o fim REAL (um evento que vira a noite só apaga quando acaba de verdade). */
  const isPast = (b: ScheduleBlock) => b.endsOn < today || (b.endsOn === today && toMinutes(b.endsAt) <= nowMinutes);

  return (
    <View style={styles.root}>
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

      {/* Arrastar para os lados troca a semana (o card acompanha o dedo). */}
      <GestureDetector gesture={swipe}>
        <Animated.View style={[styles.card, slideStyle]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {/* Fundo amarelinho de sábado e domingo (altura toda do card) */}
          {colWidth > 0 && <View style={[styles.weekend, { left: GUTTER + colWidth * 5, width: colWidth * 2 }]} />}

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

          {/* Cabeçalho acima fica FIXO; só a grade de horas abaixo rola (e some "atrás" do cabeçalho). */}
          <ScrollView
            ref={scrollRef}
            style={styles.gridScroll}
            contentContainerStyle={{
              paddingTop: TOP_PAD,
              paddingBottom: bottomPadding,
            }}
            contentOffset={{ x: 0, y: initialY }}
            onContentSizeChange={(_, h) => scrollToInitial(h)}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ height: GRID_HEIGHT + 12 }}>
              {/* Linhas das horas (12a … 11p) */}
              {HOURS.map((h) => (
                <View key={h} style={[styles.hourRow, { top: h * HOUR_HEIGHT }]}>
                  <Text style={styles.hourText}>{hourLabel(h)}</Text>
                  <View style={styles.hourLine} />
                </View>
              ))}
              {/* Linha final (meia-noite seguinte), sem texto */}
              <View style={[styles.hourRow, { top: GRID_HEIGHT }]}>
                <View style={{ width: GUTTER }} />
                <View style={styles.hourLine} />
              </View>
              {/* Linhas verticais entre os dias */}
              {colWidth > 0 &&
                WEEKDAYS.map((d, i) => (
                  <View key={d} style={[styles.vLine, { left: GUTTER + colWidth * i, height: GRID_HEIGHT }]} />
                ))}

              {/* Fim de semana: linhas da grade próprias (dourado clarinho, mais escuras que a coluna) */}
              {colWidth > 0 && (
                <>
                  {[...HOURS, 24].map((h) => (
                    <View
                      key={`we-${h}`}
                      style={[styles.weekendHLine, { top: h * HOUR_HEIGHT, left: GUTTER + colWidth * 5 + 1, width: colWidth * 2 - 1 }]}
                    />
                  ))}
                  <View style={[styles.weekendVLine, { left: GUTTER + colWidth * 6, height: GRID_HEIGHT }]} />
                  {/* Borda direita da grade (depois de domingo): separa a grade do fundo da tela */}
                  <View style={[styles.edgeLine, { left: width - 1, height: GRID_HEIGHT }]} />
                </>
              )}

              {/* Blocos */}
              {colWidth > 0 &&
                days.map((blocks, dayIndex) =>
                  lanes(blocks).map(({ block, lane, count }) => {
                    const top = y(block.start);
                    const height = Math.max(22, y(block.end) - top);
                    const laneWidth = (colWidth - 4) / count;
                    const textColor = theme.courseText(block.color);
                    const past = isPast(block);
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
                          past && styles.past,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`${block.label}, ${block.start} to ${block.end}${past ? ', finished' : ''}`}
                      >
                        <Text
                          style={[styles.blockText, { color: textColor }]}
                          numberOfLines={Math.max(1, Math.floor(height / 14))}
                        >
                          {blockLabel(block)}
                        </Text>
                      </Pressable>
                    );
                  }),
                )}

              {/* Linha vermelha do "agora" (como no Google Calendar): só na coluna de hoje, desce com o relógio. */}
              {colWidth > 0 && todayIndex >= 0 && (
                <View
                  pointerEvents="none"
                  accessibilityLabel="Current time"
                  style={[
                    styles.nowRow,
                    {
                      top: nowY - NOW_DOT / 2,
                      left: GUTTER + colWidth * todayIndex - NOW_DOT / 2,
                      width: colWidth + NOW_DOT / 2,
                    },
                  ]}
                >
                  <View style={styles.nowDot} />
                  <View style={styles.nowLine} />
                </View>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    weekRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionLabel: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      letterSpacing: 0.4,
      color: c.muted,
    },
    arrows: { flexDirection: 'row', gap: 4 },
    arrow: {
      width: 32,
      height: 28,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.card,
    },
    root: { flex: 1 },
    card: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 20,
      overflow: 'hidden',
    },
    weekend: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      backgroundColor: c.weekend,
    },
    // Linha fina embaixo dos dias: separa o cabeçalho fixo da grade que rola por baixo.
    header: {
      flexDirection: 'row',
      height: HEADER,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: c.gridLine,
    },
    gridScroll: { flex: 1 },
    dayHead: { flex: 1, alignItems: 'center' },
    dayName: { fontFamily: fonts.medium, fontSize: 11, color: c.muted },
    dayNum: { fontFamily: fonts.regular, fontSize: 10, color: c.placeholder },
    today: { color: c.accentSoftText, fontFamily: fonts.bold },
    hourRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    hourText: {
      width: GUTTER,
      fontFamily: fonts.regular,
      fontSize: 10,
      color: c.muted,
      paddingLeft: 4,
      marginTop: -6,
    },
    hourLine: { flex: 1, height: 1, backgroundColor: c.gridLine },
    weekendHLine: { position: 'absolute', height: 1.5, backgroundColor: c.weekendLine },
    weekendVLine: { position: 'absolute', top: 0, width: 1.5, backgroundColor: c.weekendLine },
    edgeLine: { position: 'absolute', top: 0, width: 1, backgroundColor: c.gridEdge },
    vLine: {
      position: 'absolute',
      top: 0,
      width: 1,
      backgroundColor: c.gridLine,
    },
    block: {
      position: 'absolute',
      borderRadius: 6,
      borderLeftWidth: 3,
      paddingHorizontal: 3,
      paddingVertical: 3,
      overflow: 'hidden',
    },
    past: { opacity: PAST_OPACITY },
    blockText: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 13 },
    nowRow: {
      position: 'absolute',
      height: NOW_DOT,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 10,
      elevation: 10,
    },
    nowDot: {
      width: NOW_DOT,
      height: NOW_DOT,
      borderRadius: NOW_DOT / 2,
      backgroundColor: c.nowLine,
    },
    nowLine: { flex: 1, height: 2, marginLeft: -1, backgroundColor: c.nowLine },
  });
