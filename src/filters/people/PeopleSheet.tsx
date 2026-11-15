import { Clock, UserPlus } from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { FilterSheet } from '../../components/sheet/FilterSheet';
import { SheetScrollView } from '../../components/sheet/SheetScrollView';
import { useFriends } from '../../services/friends/FriendsProvider';
import { fonts, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import { PersonRow } from './PersonRow';
import type { PeopleFilterState } from './usePeopleFilter';

interface Props {
  state: PeopleFilterState;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  onAddFriend: () => void;
}

/** A aba do filtro People: você + amigos, cada um com checkbox para mostrar/esconder o caminho. */
export function PeopleSheet({ state, onClose, onIndexChange, onAddFriend }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { pendingRequests, removeFriend } = useFriends();
  const { days, visibleIds, toggle } = state;
  const n = visibleIds.size;
  const subtitle = `${n} selected · ${n > 1 ? 'Compare your day' : "Today's schedule"}`;

  // Pede confirmação antes de remover (evita remover alguém sem querer).
  const confirmRemove = (id: string, name: string) => {
    Alert.alert(`Remove ${name}?`, "You'll stop seeing each other's schedules. You can add them again later.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFriend(id) },
    ]);
  };

  return (
    <FilterSheet title="Friends" subtitle={subtitle} onClose={onClose} onIndexChange={onIndexChange}>
      <SheetScrollView contentContainerStyle={styles.content}>
        {days.map((day) => (
          <PersonRow
            key={day.person.id}
            day={day}
            checked={visibleIds.has(day.person.id)}
            onToggle={() => toggle(day.person.id)}
            onRemove={day.person.isMe ? undefined : () => confirmRemove(day.person.id, day.person.name)}
          />
        ))}

        {/* Pedidos enviados por email que ainda não foram aceitos */}
        {pendingRequests.map((r) => (
          <View key={r.id} style={styles.pending}>
            <Clock size={18} color={colors.muted} strokeWidth={1.8} />
            <View style={styles.pendingText}>
              <Text style={styles.pendingEmail} numberOfLines={1}>
                {r.email}
              </Text>
              <Text style={styles.pendingSub}>Invite sent · waiting for them to accept</Text>
            </View>
          </View>
        ))}

        <Pressable onPress={onAddFriend} style={styles.addRow} accessibilityRole="button">
          <UserPlus size={20} color={colors.ink} strokeWidth={1.8} />
          <Text style={styles.addText}>Add friends</Text>
        </Pressable>

        <Text style={styles.footnote}>Example schedules · Walking routes powered by OpenRouteService</Text>
      </SheetScrollView>
    </FilterSheet>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 32, gap: 4 },
  pending: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, padding: 12 },
  pendingText: { flex: 1, gap: 2 },
  pendingEmail: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  pendingSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, padding: 12, marginTop: 4 },
  addText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  footnote: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginHorizontal: 24, marginTop: 16 },
});
