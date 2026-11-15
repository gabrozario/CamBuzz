import { X } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { FILTERS } from '../filters/filterConfig';
import { fonts, spacing, useAppTheme, useThemedStyles, type Palette } from '../theme';
import type { FilterKey } from '../types';

interface Props {
  active: FilterKey[];
  /** O filtro que você está vendo agora (aba aberta). */
  focus: FilterKey | null;
  onPress: (key: FilterKey) => void;
  /** Desliga direto (botão × do filtro em segundo plano). */
  onRemove: (key: FilterKey) => void;
}

/**
 * Barra "voadora" com os 4 filtros (Events, Resources, Food options, Friends):
 * pílula flutuante por cima do mapa e da aba (o MapScreen posiciona).
 * - Em foco (o que você está vendo): pílula escura + texto forte.
 * - Ligado em segundo plano: pílula apagada + "×" para desligar com um toque.
 */
export function FilterBar({ active, focus, onPress, onRemove }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.bar}>
      {FILTERS.map(({ key, label, icon: Icon }) => {
        const isActive = active.includes(key);
        const isFocus = isActive && focus === key;
        const isBackground = isActive && !isFocus;
        return (
          <View key={key} style={styles.slot}>
            <Pressable
              onPress={() => onPress(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocus }}
              accessibilityLabel={isBackground ? `${label}, on in background. Tap to view` : label}
              style={({ pressed }) => [
                styles.item,
                isFocus && styles.itemFocus,
                isBackground && styles.itemBackground,
                pressed && styles.pressed,
              ]}
            >
              <Icon size={22} color={isFocus ? colors.ink : colors.muted} strokeWidth={isFocus ? 2 : 1.6} />
              <Text
                style={[styles.label, isFocus && styles.labelFocus, isBackground && styles.labelBackground]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
            {isBackground && (
              <Pressable
                onPress={() => onRemove(key)}
                hitSlop={10}
                style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Turn off ${label}`}
              >
                <X size={11} color={colors.surface} strokeWidth={3} />
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      // Vidro meio transparente: dá para ver o mapa/lista passando por trás.
      backgroundColor: colors.floatingBar,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: colors.floatingBarBorder,
      padding: 6,
      gap: spacing.xs,
      // Sombra só no iPhone: no Android a "elevation" com fundo transparente deixa uma mancha escura dentro.
      ...Platform.select({
        ios: { shadowColor: '#233A43', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
        default: {},
      }),
    },
    slot: { flex: 1 },
    item: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
      paddingHorizontal: 4,
      borderRadius: 24,
    },
    // Em foco: a pílula do Figma, mais escura/forte.
    itemFocus: { backgroundColor: colors.activeTab, borderWidth: 1.5, borderColor: colors.ink },
    // Segundo plano: mesma pílula, bem apagada.
    itemBackground: { backgroundColor: colors.activeTab, opacity: 0.55 },
    pressed: { opacity: 0.7 },
    label: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
    labelFocus: { fontFamily: fonts.bold, color: colors.ink },
    labelBackground: { fontFamily: fonts.semibold },
    remove: {
      position: 'absolute',
      top: -3,
      right: 0,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.surface,
    },
  });
