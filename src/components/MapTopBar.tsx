import { CalendarDays, Search, Settings, UserPlus, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, radius, shadow, spacing, useAppTheme, useThemedStyles, type Palette } from '../theme';
import { IconButton, ICON_BUTTON_SIZE } from './IconButton';

interface Props {
  topInset: number;
  /** Substitui o botão "adicionar amigo" (opcional). */
  leftAccessory?: ReactNode;
  /** Conteúdo ao lado do botão "adicionar amigo" (ex.: chip "Your day · 11:15 AM"). */
  children?: ReactNode;
  onOpenSchedule?: () => void; // tela "My schedule"
  onOpenSettings?: () => void; // tela "Settings"
  onAddFriend?: () => void; // abre o popup "Add Friends"
  onOpenSearch?: () => void; // abre a tela de busca
  /** Busca atual (ex.: "Chick-fil-A"): aparece na barra no lugar de "Search CamBuzz", com um X. */
  searchLabel?: string;
  /** X da busca atual: tira o alfinete/descrição do resultado. */
  onClearSearch?: () => void;
}

/** Barra flutuante do topo: agenda, busca, configurações e adicionar amigo. */
export function MapTopBar({
  topInset,
  leftAccessory,
  children,
  onOpenSchedule,
  onOpenSettings,
  onAddFriend,
  onOpenSearch,
  searchLabel,
  onClearSearch,
}: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.container, { paddingTop: topInset + spacing.md }]} pointerEvents="box-none">
      <View style={styles.row}>
        <IconButton icon={CalendarDays} accessibilityLabel="My schedule" onPress={onOpenSchedule} />
        {/* Busca: abre a tela de busca (src/search/SearchScreen.tsx) */}
        <Pressable
          onPress={onOpenSearch}
          style={({ pressed }) => [styles.search, pressed && { opacity: 0.8 }]}
          accessibilityRole="search"
          accessibilityLabel="Search CamBuzz"
        >
          <Search size={20} color={colors.ink} strokeWidth={1.8} />
          {searchLabel ? (
            <Text style={styles.searchValue} numberOfLines={1}>
              {searchLabel}
            </Text>
          ) : (
            <Text style={styles.searchPlaceholder}>Search CamBuzz</Text>
          )}
          {searchLabel && onClearSearch && (
            <Pressable
              onPress={onClearSearch}
              hitSlop={12}
              style={({ pressed }) => [styles.clear, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel={`Clear search ${searchLabel}`}
            >
              <X size={14} color={colors.surface} strokeWidth={2.6} />
            </Pressable>
          )}
        </Pressable>
        <IconButton icon={Settings} accessibilityLabel="Settings" onPress={onOpenSettings} />
      </View>
      <View style={styles.row} pointerEvents="box-none">
        {leftAccessory ?? <IconButton icon={UserPlus} accessibilityLabel="Add friend" onPress={onAddFriend} />}
        <View style={styles.extra} pointerEvents="box-none">
          {children}
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  search: {
    flex: 1,
    height: ICON_BUTTON_SIZE,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    ...shadow,
  },
  searchPlaceholder: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
  searchValue: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  clear: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extra: { flex: 1, alignItems: 'flex-start' },
});
