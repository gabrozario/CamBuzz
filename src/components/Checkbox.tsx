import { Check, Minus } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useAppTheme, useThemedStyles, type Palette } from '../theme';

interface Props {
  checked?: boolean;
  indeterminate?: boolean;
  color?: string; // cor de preenchimento quando marcado
}

/** Checkbox quadrado com cantos arredondados (tela People / Campus resources / Food options do Figma). Só visual — o toque fica na linha. */
export function Checkbox({ checked = false, indeterminate = false, color: colorProp }: Props) {
  const { colors } = useAppTheme();
  const color = colorProp ?? colors.ink;
  const styles = useThemedStyles(makeStyles);
  const isFilled = checked || indeterminate;
  return (
    <View style={[styles.box, isFilled ? { backgroundColor: color, borderColor: color } : styles.unchecked]}>
      {checked && <Check size={16} color={colors.onInk} strokeWidth={2.6} />}
      {indeterminate && !checked && <Minus size={16} color={colors.onInk} strokeWidth={2.8} />}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unchecked: { borderColor: colors.checkboxBorder, backgroundColor: colors.surface },
});
