import { CalendarDays, Search, Settings, UserPlus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../theme';
import { IconButton, ICON_BUTTON_SIZE } from './IconButton';

interface Props {
  topInset: number;
  /** Substitui o botão "adicionar amigo" (ex.: "‹ All events" no detalhe de um evento). */
  leftAccessory?: ReactNode;
  /** Conteúdo ao lado do botão "adicionar amigo" (ex.: chip "Your day · 11:15 AM"). */
  children?: ReactNode;
  onOpenSchedule?: () => void; // tela "My schedule" (próxima etapa)
  onOpenSettings?: () => void; // tela "Settings" (próxima etapa)
  onAddFriend?: () => void; // abre o popup "Add Friends"
}

/** Barra flutuante do topo: agenda, busca, configurações e adicionar amigo. */
export function MapTopBar({
  topInset,
  leftAccessory,
  children,
  onOpenSchedule,
  onOpenSettings,
  onAddFriend,
}: Props) {
  return (
    <View style={[styles.container, { paddingTop: topInset + spacing.md }]} pointerEvents="box-none">
      <View style={styles.row}>
        <IconButton icon={CalendarDays} accessibilityLabel="My schedule" onPress={onOpenSchedule} />
        {/* Busca: só visual por enquanto */}
        <View style={styles.search} accessibilityRole="search">
          <Search size={20} color={colors.ink} strokeWidth={1.8} />
          <Text style={styles.searchPlaceholder}>Search campus</Text>
        </View>
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

const styles = StyleSheet.create({
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
  extra: { flex: 1, alignItems: 'flex-start' },
});
