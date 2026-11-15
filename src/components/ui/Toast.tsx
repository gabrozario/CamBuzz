import { CheckCircle2, RotateCcw } from 'lucide-react-native';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, useAppTheme, useThemedStyles, type Palette } from '../../theme';

export interface ToastOptions {
  /** Toque no aviso faz algo (ex.: desfazer). Aparece a dica `actionLabel` à direita. */
  onPress?: () => void;
  /** Ex.: "Tap to undo". */
  actionLabel?: string;
}

type ShowToast = (message: string, options?: ToastOptions) => void;

const ToastContext = createContext<ShowToast>(() => {});

/**
 * Mostra um aviso rápido no topo:
 *   const toast = useToast();
 *   toast('CS 1331 added');
 *   toast("You declined Maya's invite", { actionLabel: 'Tap to undo', onPress: () => ... });
 */
export function useToast() {
  return useContext(ToastContext);
}

const DURATION_MS = 2600;
/** Com ação, fica mais tempo na tela (dá tempo de tocar). */
const DURATION_WITH_ACTION_MS = 5000;

/** Fica em volta do app (App.tsx) e desenha o aviso por cima de todas as telas. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; options?: ToastOptions } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setToast(null));
  }, [opacity]);

  const show = useCallback<ShowToast>(
    (message, options) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, options });
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(hide, options?.onPress ? DURATION_WITH_ACTION_MS : DURATION_MS);
    },
    [opacity, hide],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const action = toast?.options?.onPress;

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <Animated.View
          style={[styles.wrap, { top: insets.top + 12, opacity }]}
          pointerEvents={action ? 'box-none' : 'none'}
        >
          <Pressable
            onPress={
              action
                ? () => {
                    hide();
                    action();
                  }
                : undefined
            }
            disabled={!action}
            style={({ pressed }) => [styles.toast, pressed && { opacity: 0.85 }]}
            accessibilityRole={action ? 'button' : 'text'}
            accessibilityLabel={
              toast.options?.actionLabel ? `${toast.message}. ${toast.options.actionLabel}` : toast.message
            }
          >
            {action ? (
              <RotateCcw size={18} color={colors.surface} strokeWidth={2} />
            ) : (
              <CheckCircle2 size={18} color={colors.surface} strokeWidth={2} />
            )}
            <Text style={styles.text} numberOfLines={2}>
              {toast.message}
            </Text>
            {toast.options?.actionLabel && <Text style={styles.action}>{toast.options.actionLabel}</Text>}
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { position: 'absolute', left: 18, right: 18, alignItems: 'center' },
    // Escuro (o inverso da barra de busca branca), para não se confundir com ela.
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.ink,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    text: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.surface },
    action: { fontFamily: fonts.bold, fontSize: 13, color: colors.mint, marginLeft: 4 },
  });
