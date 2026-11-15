import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, radius, useAppTheme, useThemedStyles, type Palette } from '../../theme';

interface Props {
  label: string;
  onPress: () => void;
  /** primary = fundo escuro; secondary = branco com borda; text = só o texto. */
  variant?: 'primary' | 'secondary' | 'text';
  loading?: boolean;
  disabled?: boolean;
  /** Ícone à esquerda do texto (ex.: logo do Google). */
  icon?: ReactNode;
}

/** Botão grande das telas de login/cadastro. */
export function AuthButton({ label, onPress, variant = 'primary', loading = false, disabled = false, icon }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const isPrimary = variant === 'primary';
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        disabled && !loading && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.surface : colors.ink} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, isPrimary && styles.labelPrimary, variant === 'text' && styles.labelText]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  base: { height: 54, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primary: { backgroundColor: colors.ink },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  text: { height: 46, backgroundColor: 'transparent' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  labelPrimary: { color: colors.surface },
  labelText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 15 },
});
