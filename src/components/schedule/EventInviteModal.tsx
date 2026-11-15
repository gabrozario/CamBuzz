import { CalendarDays, CircleAlert, CircleCheck, Clock, MapPin } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFriends } from '../../services/friends/FriendsProvider';
import { confirmConflicts } from '../../services/schedule/confirmConflicts';
import { describeConflict, formatEventTime, repeatLabel } from '../../services/schedule/scheduleLogic';
import { useSchedule } from '../../services/schedule/ScheduleProvider';
import { colors, fonts, mixHex, useAppTheme, type AppColors } from '../../theme';
import { formatDate } from '../../utils/dates';
import { AppButton } from '../ui/AppButton';
import { DialogCard } from '../ui/DialogCard';
import { useToast } from '../ui/Toast';

/**
 * Popup "Maya invited you to …" — aparece quando chega um convite de evento de um amigo
 * (em qualquer tela). Aceitar coloca o evento direto na sua agenda (avisando se bater com algo).
 * Ainda não tem tela no Figma; segue o estilo dos outros popups.
 */
export function EventInviteModal() {
  const { c, vivid } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { incomingInvites, conflictsFor, respondToInvite } = useSchedule();
  const { friends } = useFriends();
  const toast = useToast();
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);

  const invite = incomingInvites[0];
  if (!invite) return null;

  const { event, from } = invite;
  const firstName = from.name.split(' ')[0];
  const color = vivid(friends.find((f) => f.id === from.id)?.color ?? colors.purple);
  const conflicts = conflictsFor({ type: 'event', draft: event });

  const respond = async (accept: boolean) => {
    let replace;
    if (accept) {
      const choice = await confirmConflicts(conflicts, event.name);
      if (choice === 'cancel') return;
      if (choice === 'replace') replace = conflicts;
    }
    setBusy(accept ? 'accept' : 'decline');
    const result = await respondToInvite(invite.id, accept, replace);
    setBusy(null);
    if (result.ok) toast(accept ? `${event.name} is on your schedule` : `You declined ${firstName}'s invite`);
  };

  return (
    <DialogCard visible onClose={() => {}} showReturn={false}>
      <View style={styles.fromRow}>
        <View style={[styles.avatar, { backgroundColor: mixHex(color, c.card, 0.18) }]}>
          <Text style={[styles.avatarText, { color }]}>{firstName.charAt(0)}</Text>
        </View>
        <Text style={styles.fromText}>
          <Text style={styles.fromName}>{firstName}</Text> invited you
        </Text>
      </View>

      <Text style={styles.title}>{event.name}</Text>

      <View style={styles.details}>
        <View style={styles.detail}>
          <CalendarDays size={18} color={c.muted} strokeWidth={1.8} />
          <Text style={styles.detailText}>
            {formatDate(event.date)}
            {event.repeat !== 'none' ? ` · ${repeatLabel(event.repeat)}` : ''}
          </Text>
        </View>
        <View style={styles.detail}>
          <Clock size={18} color={c.muted} strokeWidth={1.8} />
          <Text style={styles.detailText}>
            {formatEventTime(event)}
          </Text>
        </View>
        {!!event.location && (
          <View style={styles.detail}>
            <MapPin size={18} color={c.muted} strokeWidth={1.8} />
            <Text style={styles.detailText}>{event.location}</Text>
          </View>
        )}
      </View>

      <View style={[styles.fit, { backgroundColor: conflicts.length ? mixHex(colors.error, c.card, 0.14) : c.accentSoft }]}>
        {conflicts.length ? (
          <CircleAlert size={18} color={c.error} strokeWidth={2} />
        ) : (
          <CircleCheck size={18} color={c.accentSoftText} strokeWidth={2} />
        )}
        <Text style={[styles.fitText, { color: conflicts.length ? c.error : c.accentSoftText }]}>
          {conflicts.length ? `Overlaps ${describeConflict(conflicts[0])}` : 'Fits your schedule'}
        </Text>
      </View>

      <View style={styles.buttons}>
        <AppButton label="Accept" onPress={() => respond(true)} loading={busy === 'accept'} style={styles.flex} />
        <AppButton
          label="Decline"
          variant="soft"
          onPress={() => respond(false)}
          loading={busy === 'decline'}
          style={styles.flex}
        />
      </View>
    </DialogCard>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    fromRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: fonts.bold, fontSize: 16 },
    fromText: { fontFamily: fonts.regular, fontSize: 15, color: c.muted },
    fromName: { fontFamily: fonts.semibold, color: c.text },
    title: { fontFamily: fonts.bold, fontSize: 28, color: c.text, marginTop: 18, letterSpacing: -0.4 },
    details: { marginTop: 18, gap: 12 },
    detail: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    detailText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 15, color: c.text },
    fit: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22, padding: 12, borderRadius: 14 },
    fitText: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 13 },
    buttons: { flexDirection: 'row', gap: 12, marginTop: 28 },
    flex: { flex: 1 },
  });
