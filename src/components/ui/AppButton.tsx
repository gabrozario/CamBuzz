import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { fonts, useAppTheme, type AppColors } from '../../theme';

interface Props {
  label: string;
  onPress: () => void;
  /** primary = navy (Done); soft = dourado clarinho (Cancel); mint = buzz, "Invite friends" sem ninguém. */
  variant?: 'primary' | 'soft' | 'mint';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Botão grande e arredondado das telas de agenda/configurações. */
export function AppButton({ label, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const { c, readableOn } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const bg = variant === 'primary' ? c.accent : variant === 'mint' ? c.mint : c.accentSoft;
  const fg = variant === 'primary' ? c.onAccent : variant === 'mint' ? readableOn(c.mint) : c.accentSoftText;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.button, { backgroundColor: bg }, (pressed || disabled) && styles.dim, style]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.label, { color: fg }]}>{label}</Text>}
    </Pressable>
  );
}

const makeStyles = (_c: AppColors) =>
  StyleSheet.create({
    button: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
    label: { fontFamily: fonts.semibold, fontSize: 16 },
    dim: { opacity: 0.7 },
  });
