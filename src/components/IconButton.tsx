import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { radius, shadow, useAppTheme, useThemedStyles, type Palette } from '../theme';

interface Props {
  icon: LucideIcon;
  onPress?: () => void;
  accessibilityLabel: string;
}

/** Botão quadrado branco flutuante sobre o mapa (calendário, configurações, adicionar amigo). */
export function IconButton({ icon: Icon, onPress, accessibilityLabel }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon size={22} color={colors.ink} strokeWidth={1.8} />
    </Pressable>
  );
}

export const ICON_BUTTON_SIZE = 48;

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  button: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  pressed: { opacity: 0.7 },
});
