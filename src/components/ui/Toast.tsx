import { CheckCircle2 } from 'lucide-react-native';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, shadow, useAppTheme, useThemedStyles, type Palette } from '../../theme';

const ToastContext = createContext<(message: string) => void>(() => {});

/** Mostra um aviso rápido no topo: `const toast = useToast(); toast('CS 1331 added')`. */
export function useToast() {
  return useContext(ToastContext);
}

const DURATION_MS = 2600;

/** Fica em volta do app (App.tsx) e desenha o aviso por cima de todas as telas. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (text: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(text);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setMessage(null));
      }, DURATION_MS);
    },
    [opacity],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message && (
        <Animated.View style={[styles.wrap, { top: insets.top + 12, opacity }]} pointerEvents="none">
          <View style={styles.toast}>
            <CheckCircle2 size={18} color={colors.green} strokeWidth={2} />
            <Text style={styles.text} numberOfLines={2}>
              {message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  wrap: { position: 'absolute', left: 18, right: 18, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...shadow,
  },
  text: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
});
