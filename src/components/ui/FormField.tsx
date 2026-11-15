import type { LucideIcon } from 'lucide-react-native';
import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { fonts, useAppTheme, type AppColors } from '../../theme';

/** Rótulo pequeno acima de um campo ("Event Name", "Course code"...). */
export function FieldLabel({ children }: { children: ReactNode }) {
  const { c } = useAppTheme();
  return <Text style={[base.label, { color: c.muted }]}>{children}</Text>;
}

/** Campo de texto do Figma: fundo bege, borda fina, cantos arredondados. */
export function FormInput(props: TextInputProps) {
  const { c } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  return <TextInput placeholderTextColor={c.placeholder} {...props} style={[styles.box, styles.input, props.style]} />;
}

interface PickerProps {
  value?: string | null;
  placeholder: string;
  onPress: () => void;
  icon?: LucideIcon;
  /** Caixa de opções aberta (borda destacada). */
  active?: boolean;
  accessibilityLabel: string;
}

/** Campo que abre um seletor ao tocar ("Select time", "Select day", "Repeat"). */
export function PickerField({ value, placeholder, onPress, icon: Icon, active, accessibilityLabel }: PickerProps) {
  const { c } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.box, styles.picker, active && { borderColor: c.accent }, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded: !!active }}
    >
      <Text style={[styles.pickerText, !value && { color: c.placeholder }]} numberOfLines={1}>
        {value || placeholder}
      </Text>
      {Icon && <Icon size={18} color={c.muted} strokeWidth={1.8} />}
    </Pressable>
  );
}

/** Espaço vertical entre grupos do formulário. */
export function FieldGroup({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[base.group, style]}>{children}</View>;
}

const base = StyleSheet.create({
  label: { fontFamily: fonts.medium, fontSize: 13, marginBottom: 8 },
  group: { marginTop: 20 },
});

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    box: {
      minHeight: 50,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.fieldBorder,
      backgroundColor: c.field,
      paddingHorizontal: 14,
    },
    input: { fontFamily: fonts.regular, fontSize: 16, color: c.text, paddingVertical: 12 },
    picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    pickerText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 16, color: c.text },
  });
