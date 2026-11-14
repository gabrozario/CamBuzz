import { Check } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

interface Props {
  checked: boolean;
  color?: string; // cor de preenchimento quando marcado
}

/** Checkbox quadrado com cantos arredondados (tela People / Food options do Figma). Só visual — o toque fica na linha. */
export function Checkbox({ checked, color = colors.ink }: Props) {
  return (
    <View style={[styles.box, checked ? { backgroundColor: color, borderColor: color } : styles.unchecked]}>
      {checked && <Check size={16} color={colors.white} strokeWidth={2.6} />}
    </View>
  );
}

const styles = StyleSheet.create({
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
