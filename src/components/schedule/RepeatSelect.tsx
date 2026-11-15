import { Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { REPEAT_OPTIONS, repeatLabel } from '../../services/schedule/scheduleLogic';
import { fonts, useAppTheme, type AppColors } from '../../theme';
import type { RepeatRule } from '../../types';

interface Props {
  value: RepeatRule;
  onChange: (value: RepeatRule) => void;
}

/** Campo "Repeat": toca e abre a caixa de opções (uma vez, todo dia, dias úteis, semanal, mensal). */
export function RepeatSelect({ value, onChange }: Props) {
  const { c } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <View>
      <Pressable
        onPress={() => setOpen(!open)}
        style={({ pressed }) => [styles.field, open && styles.fieldOpen, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel={`Repeat: ${repeatLabel(value)}`}
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.value}>{repeatLabel(value)}</Text>
        <Chevron size={18} color={c.muted} strokeWidth={1.8} />
      </Pressable>
      {open && (
        <View style={styles.box}>
          {REPEAT_OPTIONS.map((o, i) => {
            const selected = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  i < REPEAT_OPTIONS.length - 1 && styles.divider,
                  pressed && { opacity: 0.6 },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.optionText, selected && styles.optionSelected]}>{o.label}</Text>
                {selected && <Check size={18} color={c.accent} strokeWidth={2.2} />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    field: {
      minHeight: 50,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.fieldBorder,
      backgroundColor: c.field,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    fieldOpen: { borderColor: c.accent },
    value: { fontFamily: fonts.regular, fontSize: 16, color: c.text },
    box: {
      marginTop: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.fieldBorder,
      backgroundColor: c.card,
      overflow: 'hidden',
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.fieldBorder },
    optionText: { fontFamily: fonts.regular, fontSize: 15, color: c.text },
    optionSelected: { fontFamily: fonts.semibold, color: c.accentSoftText },
  });
