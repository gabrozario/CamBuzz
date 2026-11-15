import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { fonts, radius, useAppTheme, useThemedStyles, type Palette } from '../../theme';

interface Props extends Omit<TextInputProps, 'style' | 'secureTextEntry'> {
  label: string;
  /** Campo de senha: esconde o texto e mostra o botão de olho. */
  password?: boolean;
}

/** Campo de texto com rótulo em cima (nome, email, senha). */
export function AuthTextField({ label, password = false, ...inputProps }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, focused && styles.boxFocused]}>
        <TextInput
          {...inputProps}
          style={styles.input}
          placeholderTextColor={colors.subtle}
          secureTextEntry={password && hidden}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
        />
        {password && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            {hidden ? (
              <Eye size={20} color={colors.muted} strokeWidth={1.8} />
            ) : (
              <EyeOff size={20} color={colors.muted} strokeWidth={1.8} />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    gap: 10,
  },
  boxFocused: { borderColor: colors.green, borderWidth: 1.5 },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.ink, paddingVertical: 0 },
});
