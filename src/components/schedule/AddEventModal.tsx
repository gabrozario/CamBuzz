import { CalendarDays, Clock } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getBuilding } from '../../../data';
import { useFriends } from '../../services/friends/FriendsProvider';
import { confirmConflicts } from '../../services/schedule/confirmConflicts';
import { useSchedule } from '../../services/schedule/ScheduleProvider';
import { fonts, useAppTheme, type AppColors } from '../../theme';
import type { EventDraft, RepeatRule } from '../../types';
import { matchBuilding } from '../../utils/buildingSearch';
import { addDays, formatDate } from '../../utils/dates';
import { formatTime, toTime } from '../../utils/time';
import { AppButton } from '../ui/AppButton';
import { DialogCard } from '../ui/DialogCard';
import { FieldGroup, FieldLabel, FormInput, PickerField } from '../ui/FormField';
import { useToast } from '../ui/Toast';
import { CalendarSelect } from './CalendarSelect';
import { InviteFriendsList } from './InviteFriendsList';
import { LocationField } from './LocationField';
import { RepeatSelect } from './RepeatSelect';
import { TimeSelect } from './TimeSelect';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type PickerKind = 'date' | 'start' | 'end';

/** "Maya", "Maya and Priya", "Maya, Priya and Jordan" */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

const DAY = 24 * 60;

/**
 * Popup "Add Event" (Figma "Schedule · Add Event" + "Invite friends"):
 * nome, dia, horário, repetição e local → Done coloca na agenda (avisando se bater com algo).
 * "Invite friends" abre a lista de amigos (com quem está livre) no mesmo popup.
 */
export function AddEventModal({ visible, onClose }: Props) {
  const { c } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { today, conflictsFor, addEvent } = useSchedule();
  const { friends } = useFriends();
  const toast = useToast();

  const [step, setStep] = useState<'form' | 'invite'>('form');
  const [name, setName] = useState('');
  const [date, setDate] = useState(today);
  // Horários em MINUTOS desde a meia-noite do dia do evento. `end` >= 1440 = termina no dia seguinte.
  const [start, setStart] = useState<number | null>(null);
  const [end, setEnd] = useState<number | null>(null);
  const [repeat, setRepeat] = useState<RepeatRule>('none');
  const [location, setLocation] = useState('');
  const [buildingId, setBuildingId] = useState<string | undefined>();
  const [invited, setInvited] = useState<string[]>([]);
  const [picker, setPicker] = useState<PickerKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Formulário limpo toda vez que abre.
  useEffect(() => {
    if (!visible) return;
    setStep('form');
    setName('');
    setDate(today);
    setStart(null);
    setEnd(null);
    setRepeat('none');
    setLocation('');
    setBuildingId(undefined);
    setInvited([]);
    setPicker(null);
    setError(null);
    setSaving(false);
  }, [visible, today]);

  /** Horários no formato salvo na agenda ("HH:MM" + endsNextDay). */
  const timing =
    start !== null && end !== null ? { start: toTime(start), end: toTime(end), endsNextDay: end >= DAY } : null;
  const nextDay = addDays(date, 1);

  const invitedNames = friends.filter((f) => invited.includes(f.id)).map((f) => f.name.split(' ')[0]);

  /** Abre/fecha uma caixa de seleção (só uma aberta por vez). */
  const togglePicker = (kind: PickerKind) => setPicker((p) => (p === kind ? null : kind));

  const pickDate = (iso: string) => {
    setDate(iso);
    setPicker(null);
    setError(null);
  };

  const pickTime = (kind: 'start' | 'end', minutes: number) => {
    setError(null);
    if (kind === 'start') {
      setStart(minutes);
      // "To" automático: 1 hora depois (se ainda não escolhido, ficou antes do início ou passou de 24 h).
      // Ex.: começa 11:30 PM → termina 12:30 AM do dia seguinte.
      if (end === null || end <= minutes || end - minutes >= DAY) setEnd(minutes + 60);
      setPicker(null);
    } else {
      setEnd(minutes);
      setPicker(null);
    }
  };

  const changeLocation = (text: string) => {
    setLocation(text);
    setBuildingId(matchBuilding(text)?.id);
  };

  const pickBuilding = (id: string) => {
    setLocation(getBuilding(id).name);
    setBuildingId(id);
  };

  const submit = async () => {
    if (saving) return;
    if (!name.trim()) return setError('Give your event a name.');
    if (start === null || end === null || !timing) return setError('Choose when it starts and ends.');
    if (end <= start) return setError('The end time must be after the start time.');

    const draft: EventDraft = {
      name: name.trim(),
      location: location.trim(),
      buildingId,
      date,
      start: timing.start,
      end: timing.end,
      ...(timing.endsNextDay ? { endsNextDay: true } : {}),
      repeat,
    };
    const conflicts = conflictsFor({ type: 'event', draft });
    const choice = await confirmConflicts(conflicts, draft.name);
    if (choice === 'cancel') return;

    setSaving(true);
    const result = await addEvent(draft, invited, choice === 'replace' ? conflicts : undefined);
    setSaving(false);
    if (!result.ok) return setError(result.error);
    toast(
      invitedNames.length
        ? `${draft.name} added · invite sent to ${joinNames(invitedNames)}`
        : `${draft.name} added to your schedule`,
    );
    onClose();
  };

  const footer = error
    ? error
    : invitedNames.length
      ? `${joinNames(invitedNames)} ${invitedNames.length === 1 ? 'is' : 'are'} selected for this event.`
      : 'Choose who you’d like to bring along.';

  return (
    <DialogCard
      visible={visible}
      onClose={onClose}
      onReturn={step === 'invite' ? () => setStep('form') : onClose}
      title={step === 'invite' ? 'Invite friends' : 'Add Event'}
      subtitle={step === 'invite' ? 'Choose friends to join your event.' : 'Make room for something beyond class.'}
    >
      {step === 'invite' ? (
        <>
          <InviteFriendsList
            when={timing ? { date, ...timing } : null}
            selectedIds={invited}
            onToggle={(id) => setInvited((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
          />
          <AppButton label="Done" onPress={() => setStep('form')} style={styles.bigGap} />
        </>
      ) : (
        <>
          <FieldGroup>
            <FieldLabel>Event Name</FieldLabel>
            <FormInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError(null);
              }}
              placeholder="Enter event name"
              accessibilityLabel="Event name"
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Day</FieldLabel>
            <PickerField
              value={`${formatDate(date)}${date === today ? ' · Today' : ''}`}
              placeholder="Select day"
              icon={CalendarDays}
              active={picker === 'date'}
              onPress={() => togglePicker('date')}
              accessibilityLabel="Select day"
            />
            {picker === 'date' && <CalendarSelect value={date} minDate={today} today={today} onChange={pickDate} />}
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Hour</FieldLabel>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.subLabel}>From</Text>
                <PickerField
                  value={start !== null ? formatTime(toTime(start)) : null}
                  placeholder="Select time"
                  icon={Clock}
                  active={picker === 'start'}
                  onPress={() => togglePicker('start')}
                  accessibilityLabel="Start time"
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.subLabel}>To</Text>
                <PickerField
                  value={end !== null ? `${formatTime(toTime(end))}${end >= DAY ? ' +1' : ''}` : null}
                  placeholder="Select time"
                  icon={Clock}
                  active={picker === 'end'}
                  onPress={() => togglePicker('end')}
                  accessibilityLabel="End time"
                />
              </View>
            </View>
            {end !== null && end >= DAY && picker !== 'end' && (
              <Text style={styles.nextDay}>Ends the next day · {formatDate(nextDay)}</Text>
            )}
            {picker === 'start' && <TimeSelect value={start} onChange={(m) => pickTime('start', m)} />}
            {picker === 'end' && (
              <TimeSelect
                value={end}
                after={start}
                // Lista do "To" continua depois da meia-noite → eventos que terminam no dia seguinte.
                nextDayLabel={formatDate(nextDay)}
                scrollTo={start !== null ? start + 60 : 10 * 60}
                onChange={(m) => pickTime('end', m)}
              />
            )}
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Repeat</FieldLabel>
            <RepeatSelect value={repeat} onChange={setRepeat} />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Location</FieldLabel>
            <LocationField
              value={location}
              buildingId={buildingId}
              onChange={changeLocation}
              onPickBuilding={pickBuilding}
            />
          </FieldGroup>

          <AppButton
            label={invited.length ? `Invite friends · ${invited.length} selected` : 'Invite friends'}
            variant={invited.length ? 'primary' : 'mint'}
            onPress={() => setStep('invite')}
            style={styles.bigGap}
          />
          <AppButton label="Done" onPress={submit} loading={saving} style={styles.smallGap} />
          <Text style={[styles.footer, error && { color: c.error }]}>{footer}</Text>
        </>
      )}

    </DialogCard>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 12 },
    flex: { flex: 1 },
    nextDay: { fontFamily: fonts.medium, fontSize: 13, color: c.accentSoftText, marginTop: 8 },
    subLabel: { fontFamily: fonts.medium, fontSize: 13, color: c.muted, marginBottom: 8 },
    bigGap: { marginTop: 32 },
    smallGap: { marginTop: 12 },
    footer: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, marginTop: 8 },
  });
