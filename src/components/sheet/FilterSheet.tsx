import BottomSheet from '@gorhom/bottom-sheet';
import { ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { useCallback, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import { useBottomClearance } from './bottomClearance';

/**
 * Alturas da aba (índices usados em snapToIndex):
 * 0 = recolhida (só o título), 1 = meio (35% da tela), 2 = tela cheia.
 * A aba vai até o fim da tela, por trás da barra de filtros "voadora"; por isso as
 * alturas somam `clearance` (o pedaço coberto pela barra) — ver bottomClearance.ts.
 * Para mudar a altura do meio, mude só SHEET_MID_FRACTION.
 */
export const SHEET_COLLAPSED_HEIGHT = 104;
/** Fração da tela ocupada pela parte VISÍVEL da aba na altura do meio (0.35 = 35%). */
export const SHEET_MID_FRACTION = 0.35;
export const SHEET_MID = 1;

/** Altura total da aba (em dp) em cada índice: 0 recolhida, 1 meio, 2 tela cheia. */
export function sheetHeightAt(index: number, containerHeight: number, clearance: number): number {
  if (index < 0) return 0;
  if (index === 0) return SHEET_COLLAPSED_HEIGHT + clearance;
  if (index === 1) return Math.round(containerHeight * SHEET_MID_FRACTION) + clearance;
  return containerHeight;
}

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
  /** Oculta o chevron de recolher/expandir (ex.: telas de Campus resources e Food options no Figma). */
  hideChevron?: boolean;
  /**
   * Cabeçalho próprio no lugar do título padrão (ex.: no detalhe de um evento:
   * setinha ‹ + categoria + nome). Também é área de arrastar e não rola com a lista.
   */
  customHeader?: ReactNode;
  /** Botão extra no cabeçalho, à esquerda do chevron/X (ex.: sininho de notificações na aba Friends). */
  headerAccessory?: ReactNode;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  /** Conteúdo rolável — use <SheetScrollView> (components/sheet/SheetScrollView.tsx). */
  children: ReactNode;
}

/**
 * Aba que sobe da parte de baixo (bottom sheet) com o cabeçalho do Figma:
 * título grande, subtítulo, seta (recolher/expandir) e X (fechar o filtro).
 * Reutilizável por qualquer filtro (Events, People...).
 *
 * Gestos:
 * - ARRASTAR O CABEÇALHO (pegador + título) sobe/desce a aba (recolhida ↔ 35% ↔ tela cheia);
 * - ROLAR A LISTA rola a lista em qualquer altura (não puxa a aba).
 * Por isso o cabeçalho é o "handle" da biblioteca e o arrastar pelo conteúdo está desligado.
 */
export function FilterSheet({
  ref,
  title,
  subtitle,
  note,
  hideChevron = false,
  customHeader,
  headerAccessory,
  onClose,
  onIndexChange,
  children,
}: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const clearance = useBottomClearance();
  const { height: screenHeight } = useWindowDimensions();
  const snapPoints = useMemo(
    () => [sheetHeightAt(0, screenHeight, clearance), sheetHeightAt(1, screenHeight, clearance), '100%'],
    [screenHeight, clearance],
  );
  const sheetRef = useRef<BottomSheet>(null);
  const [index, setIndex] = useState(SHEET_MID);
  const collapsed = index === 0;

  useImperativeHandle(ref, () => ({ snapTo: (i: number) => sheetRef.current?.snapToIndex(i) }), []);

  const toggleCollapsed = useCallback(
    () => sheetRef.current?.snapToIndex(collapsed ? SHEET_MID : 0),
    [collapsed],
  );

  // O cabeçalho inteiro é a área de arrastar a aba.
  const renderHeader = useCallback(
    () => (
      <View style={styles.handleArea}>
        <View style={styles.indicator} />
        {customHeader ?? (
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              {headerAccessory}
              {!hideChevron && (
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
              )}
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
      </View>
    ),
    [customHeader, headerAccessory, title, hideChevron, collapsed, toggleCollapsed, onClose, subtitle, note, styles, colors],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={SHEET_MID}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enableContentPanningGesture={false}
      enableHandlePanningGesture
      handleComponent={renderHeader}
      topInset={insets.top}
      onChange={(i) => {
        setIndex(i);
        onIndexChange?.(i);
      }}
      backgroundStyle={styles.background}
      style={styles.shadow}
    >
      {children}
    </BottomSheet>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  background: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  handleArea: { paddingTop: 10, paddingBottom: 4 },
  indicator: { alignSelf: 'center', backgroundColor: colors.handle, width: 44, height: 4, borderRadius: 2, marginBottom: 6 },
  shadow: {
    shadowColor: '#233A43',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    // Android: sem elevation, senão a aba fica por cima da barra voadora (o Android desenha por elevation).
    elevation: Platform.OS === 'android' ? 0 : 12,
  },
  header: { paddingHorizontal: 24, paddingTop: 6, paddingBottom: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 28, color: colors.ink },
  subtitleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  note: { fontFamily: fonts.regular, fontSize: 11, color: colors.subtle },
});
