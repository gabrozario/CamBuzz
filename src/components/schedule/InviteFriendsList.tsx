import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFriends } from '../../services/friends/FriendsProvider';
import { friendAvailability } from '../../services/schedule/scheduleLogic';
import { useSchedule } from '../../services/schedule/ScheduleProvider';
import { fonts, useAppTheme, type AppColors } from '../../theme';
import type { EventDraft } from '../../types';
import { formatDate } from '../../utils/dates';

interface Props {
  /** Dia e horário do evento (null = ainda não escolhido → não dá para ver quem está livre). */
  when: Pick<EventDraft, 'date' | 'start' | 'end'> | null;
  selectedIds: string[];
  onToggle: (friendId: string) => void;
}

/**
 * Lista do "Invite friends" (Figma "Schedule · Invite friends"): avatar, nome, checkbox.
 * Embaixo do nome: se o amigo está livre ou ocupado no horário do evento (puxa a agenda dele).
 */
export function InviteFriendsList({ when, selectedIds, onToggle }: Props) {
  const { c } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { friends } = useFriends();
  const { friendEvents } = useSchedule();

  if (!friends.length) {
    return <Text style={styles.empty}>Add friends first (People → Add friends) to invite them.</Text>;
  }

  return (
    <View style={styles.list}>
      {when && <Text style={styles.when}>Availability on {formatDate(when.date)}</Text>}
      {friends.map((f) => {
        const checked = selectedIds.includes(f.id);
        const availability = when ? friendAvailability(f, friendEvents[f.id] ?? [], when) : null;
        return (
          <Pressable
            key={f.id}
            onPress={() => onToggle(f.id)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            accessibilityLabel={`Invite ${f.name}${availability ? `, ${availability.text}` : ''}`}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{f.name.charAt(0)}</Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.name}>{f.name.split(' ')[0]}</Text>
              <Text
                style={[styles.status, availability && { color: availability.free ? c.success : c.error }]}
                numberOfLines={1}
              >
                {availability ? availability.text : 'Pick a day and time to see if they’re free'}
              </Text>
            </View>
            <View style={styles.check}>{checked && <View style={styles.checkFill} />}</View>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    list: { marginTop: 20, gap: 10 },
    when: { fontFamily: fonts.medium, fontSize: 12, color: c.muted, marginBottom: 2 },
    empty: { fontFamily: fonts.regular, fontSize: 14, color: c.muted, marginTop: 24 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 14,
      borderRadius: 18,
      backgroundColor: c.field,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontFamily: fonts.semibold, fontSize: 17, color: c.accentSoftText },
    body: { flex: 1, gap: 2 },
    name: { fontFamily: fonts.medium, fontSize: 17, color: c.text },
    status: { fontFamily: fonts.regular, fontSize: 12, color: c.muted },
    check: {
      width: 26,
      height: 26,
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor: c.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkFill: { width: 16, height: 16, borderRadius: 4, backgroundColor: c.accent },
  });
