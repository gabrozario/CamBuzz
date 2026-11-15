import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useAppTheme, type AppColors } from '../../theme';
import type { ISODate } from '../../types';
import { parseISODate, toISODate, WEEKDAYS, weekdayOf } from '../../utils/dates';

interface Props {
  value: ISODate;
  /** Dias antes deste ficam desativados (ex.: hoje). */
  minDate?: ISODate;
  today: ISODate;
  onChange: (date: ISODate) => void;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Caixa de calendário do "Day" (Add Event): mês com setas ‹ ›, semana começando na segunda. */
export function CalendarSelect({ value, minDate, today, onChange }: Props) {
  const { c } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const initial = parseISODate(value);
  const [month, setMonth] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

  // Células do mês: espaços vazios até o 1º dia cair na coluna certa + os dias.
  const cells = useMemo(() => {
    const first = toISODate(new Date(month.year, month.month, 1, 12));
    const blanks = WEEKDAYS.indexOf(weekdayOf(first));
    const days = new Date(month.year, month.month + 1, 0).getDate();
    return [
      ...Array.from({ length: blanks }, () => null),
      ...Array.from({ length: days }, (_, i) => toISODate(new Date(month.year, month.month, i + 1, 12))),
    ];
  }, [month]);

  const shift = (delta: number) =>
    setMonth(({ year, month: m }) => {
      const d = new Date(year, m + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  // Não deixa voltar para meses inteiros antes do mínimo.
  const canGoBack =
    !minDate || new Date(month.year, month.month, 1, 12) > parseISODate(minDate.slice(0, 8) + '01');

  return (
    <View style={styles.box}>
      <View style={styles.header}>
        <Pressable
          onPress={() => shift(-1)}
          disabled={!canGoBack}
          hitSlop={8}
          style={[styles.arrow, !canGoBack && styles.disabled]}
          accessibilityLabel="Previous month"
        >
          <ChevronLeft size={20} color={c.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.monthTitle}>
          {MONTHS[month.month]} {month.year}
        </Text>
        <Pressable onPress={() => shift(1)} hitSlop={8} style={styles.arrow} accessibilityLabel="Next month">
          <ChevronRight size={20} color={c.text} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={styles.weekday}>
            {d.charAt(0)}
          </Text>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <View key={`b${i}`} style={styles.cell} />;
          const disabled = !!minDate && iso < minDate;
          const selected = iso === value;
          const isToday = iso === today;
          return (
            <Pressable
              key={iso}
              onPress={() => onChange(iso)}
              disabled={disabled}
              style={styles.cell}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={iso}
            >
              <View style={[styles.day, isToday && styles.today, selected && styles.selected]}>
                <Text
                  style={[styles.dayText, disabled && styles.disabled, selected && styles.selectedText]}
                >
                  {parseISODate(iso).getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
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
      padding: 12,
    },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    arrow: { width: 36, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: c.field },
    monthTitle: { fontFamily: fonts.semibold, fontSize: 16, color: c.text },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    weekday: {
      width: `${100 / 7}%`,
      textAlign: 'center',
      fontFamily: fonts.medium,
      fontSize: 12,
      color: c.muted,
      paddingVertical: 6,
    },
    cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
    day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    today: { borderWidth: 1.5, borderColor: c.accent },
    selected: { backgroundColor: c.accent, borderWidth: 0 },
    dayText: { fontFamily: fonts.medium, fontSize: 15, color: c.text },
    selectedText: { color: c.onAccent, fontFamily: fonts.semibold },
    disabled: { opacity: 0.3 },
  });
