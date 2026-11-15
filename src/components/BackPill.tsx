import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import { fonts, radius, shadow, useAppTheme, useThemedStyles, type Palette } from '../theme';
import { ICON_BUTTON_SIZE } from './IconButton';

interface Props {
  label: string;
  onPress: () => void;
}

/** Botão branco "‹ All events" sobre o mapa, para voltar do detalhe para a lista. */
export function BackPill({ label, onPress }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      <ChevronLeft size={22} color={colors.ink} strokeWidth={1.8} />
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  pill: {
    height: ICON_BUTTON_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 18,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...shadow,
  },
  pressed: { opacity: 0.7 },
  text: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
});
