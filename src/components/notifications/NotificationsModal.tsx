import { CalendarDays, CircleCheck, MapPin } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFriends } from '../../services/friends/FriendsProvider';
import { confirmConflicts } from '../../services/schedule/confirmConflicts';
import { useSchedule } from '../../services/schedule/ScheduleProvider';
import { colors as lightColors, fonts, mixHex, useAppTheme, type AppColors } from '../../theme';
import type { IncomingEventInvite } from '../../types';
import { formatDate, todayISO } from '../../utils/dates';
import { formatTime, formatTimeRange } from '../../utils/time';
import { AppButton } from '../ui/AppButton';
import { DialogCard } from '../ui/DialogCard';
import { useToast } from '../ui/Toast';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** "Received today, 8:42 AM" / "Received Sat, Nov 14, 7:05 PM" */
function receivedLabel(iso?: string): string {
  if (!iso) return '';
  const [date, time] = iso.split('T');
  const hhmm = (time ?? '').slice(0, 5);
  const day = date === todayISO() ? 'today' : formatDate(date);
  return `Received ${day}${hhmm ? `, ${formatTime(hhmm)}` : ''}`;
}

/**
 * Central de notificações (sininho da aba Friends): os convites de eventos que você recebeu,
 * inclusive os que chegaram com o app fechado. Dá para aceitar/recusar ali mesmo; um convite
 * recusado ainda pode ser aceito. Abrir marca tudo como visto (some a bolinha vermelha).
 */
export function NotificationsModal({ visible, onClose }: Props) {
  const { c, vivid, legible } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { inbox, markInboxSeen, conflictsFor, respondToInvite } = useSchedule();
  const { friends } = useFriends();
  const toast = useToast();
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  // Ao abrir: guarda quais eram novas (para o selo "New") e marca tudo como visto.
  useEffect(() => {
    if (!visible) return;
    setNewIds(new Set(inbox.filter((i) => !i.seen).map((i) => i.id)));
    markInboxSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const respond = async (invite: IncomingEventInvite, accept: boolean) => {
    let replace;
    if (accept) {
      const conflicts = conflictsFor({ type: 'event', draft: invite.event });
      const choice = await confirmConflicts(conflicts, invite.event.name);
      if (choice === 'cancel') return;
      if (choice === 'replace') replace = conflicts;
    }
    setBusyId(invite.id);
    const result = await respondToInvite(invite.id, accept, replace);
    setBusyId(null);
    if (!result.ok) return toast(result.error);
    toast(accept ? `${invite.event.name} is on your schedule` : `You declined ${invite.from.name.split(' ')[0]}'s invite`);
  };

  return (
    <DialogCard
      visible={visible}
      onClose={onClose}
      title="Notifications"
      subtitle="Event invites from your friends"
    >
      {inbox.length === 0 && <Text style={styles.empty}>No notifications yet.</Text>}

      {inbox.map((invite) => {
        const firstName = invite.from.name.split(' ')[0];
        const color = vivid(friends.find((f) => f.id === invite.from.id)?.color ?? lightColors.purple);
        const { event } = invite;
        const isNew = newIds.has(invite.id);
        return (
          <View key={invite.id} style={[styles.item, isNew && styles.itemNew]}>
            <View style={styles.top}>
              <View style={[styles.avatar, { backgroundColor: mixHex(color, c.card, 0.2) }]}>
                <Text style={[styles.avatarText, { color: legible(color) }]}>{firstName.charAt(0)}</Text>
              </View>
              <View style={styles.text}>
                <Text style={styles.headline}>
                  <Text style={styles.bold}>{firstName}</Text> invited you to <Text style={styles.bold}>{event.name}</Text>
                </Text>
                <Text style={styles.received}>{receivedLabel(invite.receivedAt)}</Text>
              </View>
              {isNew && <Text style={styles.newTag}>New</Text>}
            </View>

            <View style={styles.details}>
              <View style={styles.detail}>
                <CalendarDays size={15} color={c.muted} strokeWidth={1.8} />
                <Text style={styles.detailText}>
                  {formatDate(event.date)} · {formatTimeRange(event.start, event.end)}
                </Text>
              </View>
              {!!event.location && (
                <View style={styles.detail}>
                  <MapPin size={15} color={c.muted} strokeWidth={1.8} />
                  <Text style={styles.detailText}>{event.location}</Text>
                </View>
              )}
            </View>

            {invite.status === 'pending' && (
              <View style={styles.buttons}>
                <AppButton
                  label="Accept"
                  onPress={() => respond(invite, true)}
                  loading={busyId === invite.id}
                  style={styles.button}
                />
                <AppButton label="Decline" variant="soft" onPress={() => respond(invite, false)} style={styles.button} />
              </View>
            )}
            {invite.status === 'accepted' && (
              <View style={styles.status}>
                <CircleCheck size={16} color={c.success} strokeWidth={2} />
                <Text style={[styles.statusText, { color: c.success }]}>On your schedule</Text>
              </View>
            )}
            {invite.status === 'declined' && (
              <View style={styles.status}>
                <Text style={styles.statusText}>Declined</Text>
                <Pressable onPress={() => respond(invite, true)} hitSlop={8} accessibilityRole="button">
                  <Text style={styles.link}>Accept instead</Text>
                </Pressable>
              </View>
            )}
          </View>
        );
      })}
    </DialogCard>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    empty: { fontFamily: fonts.regular, fontSize: 14, color: c.muted, marginTop: 20 },
    item: { marginTop: 16, padding: 14, borderRadius: 18, backgroundColor: c.field, borderWidth: 1, borderColor: c.fieldBorder },
    itemNew: { borderColor: c.accent },
    top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: fonts.bold, fontSize: 15 },
    text: { flex: 1, gap: 3 },
    headline: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.text },
    bold: { fontFamily: fonts.semibold },
    received: { fontFamily: fonts.regular, fontSize: 12, color: c.muted },
    newTag: {
      fontFamily: fonts.bold,
      fontSize: 11,
      color: c.onAccent,
      backgroundColor: c.accent,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      overflow: 'hidden',
    },
    details: { marginTop: 12, gap: 6 },
    detail: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 13, color: c.text },
    buttons: { flexDirection: 'row', gap: 10, marginTop: 14 },
    button: { flex: 1, height: 44 },
    status: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
    statusText: { fontFamily: fonts.medium, fontSize: 13, color: c.muted },
    link: { fontFamily: fonts.semibold, fontSize: 13, color: c.accentSoftText, textDecorationLine: 'underline' },
  });
