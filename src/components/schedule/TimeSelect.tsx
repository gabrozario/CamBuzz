import { Check } from 'lucide-react-native';
import { Fragment, useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { fonts, useAppTheme, type AppColors } from '../../theme';
import { formatTime, toTime } from '../../utils/time';

const DAY = 24 * 60;

interface Props {
  /**
   * Horário escolhido em MINUTOS desde a meia-noite do dia do evento (ex.: 14:30 → 870).
   * 1440 ou mais = no dia seguinte (ex.: 1590 = 2:30 AM do dia seguinte).
   */
  value: number | null;
  onChange: (minutes: number) => void;
  /** Só mostra horários depois deste (para o "To"), com a duração ao lado. */
  after?: number | null;
  /**
   * Com `after`: a lista continua depois da meia-noite (até quase 24 h de duração),
   * para eventos que terminam no dia seguinte. O texto aparece no separador "Next day".
   */
  nextDayLabel?: string;
  /** Para onde a lista rola ao abrir, se nada estiver escolhido (padrão: 9:00 AM). */
  scrollTo?: number;
}

const STEP = 15; // minutos entre as opções
const ROW = 44;
const DIVIDER = 30; // altura do separador "Next day"
const VISIBLE_ROWS = 5;

function duration(from: number, to: number): string {
  const m = to - from;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h} hr${r ? ` ${r} min` : ''}` : `${r} min`;
}

/** Caixa de horários (From/To do Add Event): lista rolável de 15 em 15 minutos. */
export function TimeSelect({ value, onChange, after, nextDayLabel, scrollTo = 9 * 60 }: Props) {
  const { c } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const hasAfter = after !== null && after !== undefined;

  const options = useMemo(() => {
    const first = hasAfter ? after + STEP : 0;
    // "To" com dia seguinte: até 24 h depois do início (exclusive). Senão: até 11:45 PM.
    const last = hasAfter && nextDayLabel ? after + DAY : DAY;
    const list: number[] = [];
    for (let m = first; m < last; m += STEP) list.push(m);
    return list;
  }, [after, hasAfter, nextDayLabel]);

  // Abre já rolado no horário escolhido (ou perto do horário sugerido).
  const target = value ?? scrollTo;
  const index = Math.max(0, options.findIndex((m) => m >= target));
  const dividerAbove = options[index] >= DAY && options[0] < DAY ? DIVIDER : 0;
  const initialY = Math.max(0, (index - 1) * ROW + dividerAbove);
  const scrollRef = useRef<ScrollViewInstance>(null);

  return (
    <View style={styles.box}>
      <ScrollView
        ref={scrollRef}
        style={{ height: ROW * VISIBLE_ROWS }}
        contentOffset={{ x: 0, y: initialY }}
        // No Android o contentOffset inicial nem sempre funciona; rolamos ao medir a lista.
        onLayout={() => scrollRef.current?.scrollTo({ y: initialY, animated: false })}
        nestedScrollEnabled
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {options.map((m, i) => {
          const selected = m === value;
          const firstOfNextDay = m >= DAY && (i === 0 || options[i - 1] < DAY);
          return (
            <Fragment key={m}>
              {firstOfNextDay && (
                <View style={styles.divider}>
                  <Text style={styles.dividerText}>Next day{nextDayLabel ? ` · ${nextDayLabel}` : ''}</Text>
                </View>
              )}
              <Pressable
                onPress={() => onChange(m)}
                style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && { opacity: 0.6 }]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${formatTime(toTime(m))}${m >= DAY ? ', next day' : ''}`}
              >
                <Text style={[styles.time, selected && styles.timeSelected]}>{formatTime(toTime(m))}</Text>
                {hasAfter && <Text style={styles.duration}>{duration(after, m)}</Text>}
                {selected && <Check size={18} color={c.accentSoftText} strokeWidth={2.2} />}
              </Pressable>
            </Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    box: {
      marginTop: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.fieldBorder,
      backgroundColor: c.card,
      overflow: 'hidden',
    },
    row: { height: ROW, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
    rowSelected: { backgroundColor: c.accentSoft },
    time: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: c.text },
    timeSelected: { fontFamily: fonts.semibold, color: c.accentSoftText },
    duration: { fontFamily: fonts.regular, fontSize: 13, color: c.muted },
    divider: {
      height: DIVIDER,
      justifyContent: 'center',
      paddingHorizontal: 16,
      backgroundColor: c.field,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: c.fieldBorder,
    },
    dividerText: { fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 0.3, color: c.muted },
  });
