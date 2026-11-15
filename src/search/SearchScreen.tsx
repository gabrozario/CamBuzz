import {
  BookOpen,
  Building2,
  ChevronLeft,
  Coffee,
  Dumbbell,
  GraduationCap,
  LayoutGrid,
  Package,
  Printer,
  Search,
  CalendarDays,
  Utensils,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFriends } from '../services/friends/FriendsProvider';
import { useSchedule } from '../services/schedule/ScheduleProvider';
import { fonts, radius, useAppTheme, useThemedStyles, type Palette } from '../theme';
import type { TimeOfDay } from '../types';
import { buildSearchIndex, searchItems, type SearchIcon, type SearchItem, type SearchTarget } from './searchIndex';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (target: SearchTarget, item: SearchItem) => void;
  /** Onde cada amigo está agora (ex.: "Library now"), por id. */
  friendStatus: Record<string, string>;
  now: TimeOfDay;
  /** Texto inicial (a busca atual, ao reabrir). */
  initialQuery?: string;
}

const ICONS: Record<Exclude<SearchIcon, 'friend'>, LucideIcon> = {
  building: Building2,
  library: BookOpen,
  printer: Printer,
  gym: Dumbbell,
  dining: Utensils,
  restaurant: UtensilsCrossed,
  coffee: Coffee,
  vending: Package,
  event: CalendarDays,
  course: GraduationCap,
  shortcut: LayoutGrid,
};

/**
 * Tela de busca ("Search CamBuzz"): pesquisa tudo do app — amigos, suas aulas, restaurantes,
 * bibliotecas/impressoras, eventos e prédios. Tocar num resultado leva até ele no mapa
 * (liga o filtro certo, abre a descrição e dá zoom — ver onSearchSelect no MapScreen).
 */
export function SearchScreen({ visible, onClose, onSelect, friendStatus, now, initialQuery = '' }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, readableOn } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { friends } = useFriends();
  const { schedule } = useSchedule();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) setQuery(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const index = useMemo(
    () => buildSearchIndex({ friends, friendStatus, courses: schedule.courses, now }),
    [friends, friendStatus, schedule.courses, now],
  );
  const results = useMemo(() => searchItems(index, query), [index, query]);
  // Sem texto: amigos + atalhos de categoria.
  const suggestions = useMemo(() => index.filter((i) => i.group === 'Friends' || i.group === 'Shortcuts'), [index]);
  const showing = query.trim() ? results : suggestions;

  const renderIcon = (item: SearchItem) => {
    if (item.icon === 'friend') {
      return (
        <View style={[styles.avatar, { backgroundColor: item.color ?? colors.me }]}>
          <Text style={[styles.avatarText, { color: readableOn(item.color ?? colors.me) }]}>{item.title.charAt(0)}</Text>
        </View>
      );
    }
    const Icon = ICONS[item.icon];
    return (
      <View style={styles.iconBox}>
        <Icon size={20} color={item.color ?? colors.ink} strokeWidth={1.8} />
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.back} accessibilityRole="button" accessibilityLabel="Back to map">
            <ChevronLeft size={26} color={colors.ink} strokeWidth={1.8} />
          </Pressable>
          <View style={styles.inputBox}>
            <Search size={18} color={colors.muted} strokeWidth={1.8} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Places, food, friends, events…"
              placeholderTextColor={colors.subtle}
              style={styles.input}
              autoFocus
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => results[0] && onSelect(results[0].target, results[0])}
              accessibilityLabel="Search CamBuzz"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
                <X size={18} color={colors.muted} strokeWidth={2} />
              </Pressable>
            )}
          </View>
        </View>

        <FlatList
          data={showing}
          keyExtractor={(item) => item.key}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          ListHeaderComponent={
            !query.trim() ? <Text style={styles.sectionLabel}>FRIENDS & SHORTCUTS</Text> : undefined
          }
          ListEmptyComponent={
            query.trim() ? (
              <Text style={styles.empty}>No results for “{query.trim()}”. Try a building, restaurant or friend.</Text>
            ) : undefined
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onSelect(item.target, item)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${item.subtitle}`}
            >
              {renderIcon(item)}
              <View style={styles.rowText}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
        />
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surface },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
    back: { padding: 4 },
    inputBox: {
      flex: 1,
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.page,
    },
    input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.ink, paddingVertical: 0 },
    sectionLabel: {
      fontFamily: fonts.semibold,
      fontSize: 11,
      letterSpacing: 0.6,
      color: colors.muted,
      marginHorizontal: 20,
      marginTop: 8,
      marginBottom: 4,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12 },
    pressed: { backgroundColor: colors.divider },
    iconBox: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.page,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.white },
    rowText: { flex: 1, gap: 2 },
    title: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
    subtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
    divider: { height: 1, backgroundColor: colors.divider, marginLeft: 72 },
    empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginHorizontal: 20, marginTop: 24 },
  });
