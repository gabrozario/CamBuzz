import BottomSheet from '@gorhom/bottom-sheet';
import { ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';

/**
 * Alturas da aba (índices usados em snapToIndex):
 * 0 = recolhida (só o título), 1 = metade da tela, 2 = tela cheia.
 */
export const SHEET_COLLAPSED_HEIGHT = 104;
export const SHEET_SNAP_POINTS = [SHEET_COLLAPSED_HEIGHT, '50%', '100%'];
export const SHEET_HALF = 1;

/** O que quem usa o FilterSheet pode comandar por ref. */
export interface FilterSheetHandle {
  snapTo: (index: number) => void;
}

interface Props {
  ref?: Ref<FilterSheetHandle>;
  title: string;
  subtitle?: string;
  /** Texto pequeno à direita do subtítulo (ex.: "Sample events"). */
  note?: string;
  /** Esconde o título grande (ex.: na tela de detalhe, que tem o próprio título). */
  hideHeader?: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  /** Conteúdo rolável — use BottomSheetScrollView do @gorhom/bottom-sheet. */
  children: ReactNode;
}

/**
 * Aba que sobe da parte de baixo (bottom sheet) com o cabeçalho do Figma:
 * título grande, subtítulo, seta (recolher/expandir) e X (fechar o filtro).
 * Reutilizável por qualquer filtro (Events, People...).
 */
export function FilterSheet({ ref, title, subtitle, note, hideHeader, onClose, onIndexChange, children }: Props) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const [index, setIndex] = useState(SHEET_HALF);
  const collapsed = index === 0;

  useImperativeHandle(ref, () => ({ snapTo: (i: number) => sheetRef.current?.snapToIndex(i) }), []);

  const toggleCollapsed = () => sheetRef.current?.snapToIndex(collapsed ? SHEET_HALF : 0);

  return (
    <BottomSheet
      ref={sheetRef}
      index={SHEET_HALF}
      snapPoints={SHEET_SNAP_POINTS}
      enableDynamicSizing={false}
      topInset={insets.top}
      onChange={(i) => {
        setIndex(i);
        onIndexChange?.(i);
      }}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
      style={styles.shadow}
    >
      {!hideHeader && (
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Pressable
              onPress={toggleCollapsed}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? (
                <ChevronUp size={24} color={colors.ink} strokeWidth={1.8} />
              ) : (
                <ChevronDown size={24} color={colors.ink} strokeWidth={1.8} />
              )}
            </Pressable>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <X size={24} color={colors.ink} strokeWidth={1.8} />
            </Pressable>
          </View>
          {!collapsed && (subtitle || note) && (
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitle}>{subtitle}</Text>
              {note && <Text style={styles.note}>{note}</Text>}
            </View>
          )}
        </View>
      )}
      {children}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  handle: { backgroundColor: colors.handle, width: 44, height: 4 },
  shadow: {
    shadowColor: colors.ink,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 12,
  },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 28, color: colors.ink },
  subtitleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  note: { fontFamily: fonts.regular, fontSize: 11, color: colors.subtle },
});
