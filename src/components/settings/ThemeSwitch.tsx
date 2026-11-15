import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme';

interface Props {
  value: boolean;
  onChange: (value: boolean) => void;
  accessibilityLabel: string;
}

const WIDTH = 54;
const KNOB = 26;
const PAD = 3;

/** Interruptor do Figma (Settings): trilho verde-acinzentado; ligado = verde com bolinha "anel" escura. */
export function ThemeSwitch({ value, onChange, accessibilityLabel }: Props) {
  const { c, isDark } = useAppTheme();
  const x = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(x, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: true }).start();
  }, [value, x]);

  return (
    <Pressable
      onPress={() => onChange(!value)}
      hitSlop={8}
      style={[styles.track, { backgroundColor: value ? c.switchOn : c.switchOff }]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View
        style={[
          styles.knob,
          value
            ? { backgroundColor: isDark ? c.card : c.page, borderColor: c.switchOn, borderWidth: 3 }
            : { backgroundColor: c.card },
          { transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, WIDTH - KNOB - PAD * 2] }) }] },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: WIDTH, height: KNOB + PAD * 2, borderRadius: 999, padding: PAD, justifyContent: 'center' },
  knob: { width: KNOB, height: KNOB, borderRadius: KNOB / 2 },
});
