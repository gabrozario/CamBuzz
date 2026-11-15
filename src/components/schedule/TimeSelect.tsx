import { Check } from 'lucide-react-native';
import { useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { fonts, useAppTheme, type AppColors } from '../../theme';
import type { TimeOfDay } from '../../types';
import { formatTime, toMinutes } from '../../utils/time';

interface Props {
  value: TimeOfDay | null;
  onChange: (time: TimeOfDay) => void;
  /** Só mostra horários depois deste (para o "To"), com a duração ao lado. */
  after?: TimeOfDay | null;
  /** Para onde a lista rola ao abrir, se nada estiver escolhido (padrão: 9:00 AM). */
  scrollTo?: TimeOfDay;
}

const STEP = 15; // minutos entre as opções
const ROW = 44;
const VISIBLE_ROWS = 5;

const toTime = (m: number): TimeOfDay => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

function duration(from: TimeOfDay, to: TimeOfDay): string {
  const m = toMinutes(to) - toMinutes(from);
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h} hr${r ? ` ${r} min` : ''}` : `${r} min`;
}

/** Caixa de horários (From/To do Add Event): lista rolável de 15 em 15 minutos. */
export function TimeSelect({ value, onChange, after, scrollTo = '09:00' }: Props) {
  const { c } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  const options = useMemo(() => {
    const first = after ? toMinutes(after) + STEP : 0;
    const list: TimeOfDay[] = [];
    for (let m = first; m < 24 * 60; m += STEP) list.push(toTime(m));
    return list;
  }, [after]);

  // Abre já rolado no horário escolhido (ou perto do horário sugerido).
  const target = value ?? scrollTo;
  const index = Math.max(0, options.findIndex((t) => toMinutes(t) >= toMinutes(target)));
  const initialY = Math.max(0, (index - 1) * ROW);
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
        {options.map((t) => {
          const selected = t === value;
          return (
            <Pressable
              key={t}
              onPress={() => onChange(t)}
              style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && { opacity: 0.6 }]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.time, selected && styles.timeSelected]}>{formatTime(t)}</Text>
              {after && <Text style={styles.duration}>{duration(after, t)}</Text>}
              {selected && <Check size={18} color={c.accentSoftText} strokeWidth={2.2} />}
            </Pressable>
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
  });
