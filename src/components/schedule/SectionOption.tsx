import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getBuilding } from '../../../data';
import { fonts, useAppTheme, type AppColors } from '../../theme';
import type { CatalogSection } from '../../types';
import { formatDaysShort } from '../../utils/dates';
import { formatTimeRange } from '../../utils/time';

interface Props {
  section: CatalogSection;
  selected: boolean;
  /** Ex.: "Your current section" */
  tag?: string;
  /** Ex.: "Overlaps CS 2110 · Mon 2:00–3:15 PM" */
  warning?: string;
  onPress: () => void;
}

/** Card de uma section (Figma "Schedule · Add Course · Section options"): professor, dias/horário, "Section A" e o radio. */
export function SectionOption({ section, selected, tag, warning, onPress }: Props) {
  const { c } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [main, ...others] = section.meetings;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`Section ${section.id}, ${section.instructor}`}
    >
      <View style={styles.body}>
        <Text style={styles.instructor}>{section.instructor}</Text>
        <Text style={styles.time}>
          {formatDaysShort(main.days)} · {formatTimeRange(main.start, main.end)}
        </Text>
        {others.map((m, i) => (
          <Text key={i} style={styles.time}>
            {m.kind} · {formatDaysShort(m.days)} · {formatTimeRange(m.start, m.end)}
          </Text>
        ))}
        <Text style={styles.where} numberOfLines={1}>
          {getBuilding(main.buildingId).shortName}
          {main.room ? ` ${main.room}` : ''}
        </Text>
        <Text style={styles.section}>
          Section {section.id}
          {tag ? ` · ${tag}` : ''}
        </Text>
        {warning && <Text style={styles.warning}>{warning}</Text>}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.dot} />}</View>
    </Pressable>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.fieldBorder,
      backgroundColor: c.field,
      marginTop: 12,
    },
    cardSelected: { borderColor: c.accent, borderWidth: 2, padding: 15 },
    pressed: { opacity: 0.8 },
    body: { flex: 1, gap: 4 },
    instructor: { fontFamily: fonts.semibold, fontSize: 17, color: c.text },
    time: { fontFamily: fonts.regular, fontSize: 14, color: c.muted },
    where: { fontFamily: fonts.regular, fontSize: 13, color: c.placeholder },
    section: { fontFamily: fonts.medium, fontSize: 13, color: c.accentSoftText, marginTop: 4 },
    warning: { fontFamily: fonts.medium, fontSize: 12, color: c.error, marginTop: 2 },
    radio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.fieldBorder,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    radioSelected: { borderColor: c.cardBorder },
    dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: c.accent },
  });
