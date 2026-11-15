import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays, Clock } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getBuilding } from '../../../data';
import { useFriends } from '../../services/friends/FriendsProvider';
import { confirmConflicts } from '../../services/schedule/confirmConflicts';
import { useSchedule } from '../../services/schedule/ScheduleProvider';
import { fonts, useAppTheme, type AppColors } from '../../theme';
import type { EventDraft, RepeatRule, TimeOfDay } from '../../types';
import { matchBuilding } from '../../utils/buildingSearch';
import { dateToTime, formatDate, parseISODate, timeToDate, toISODate } from '../../utils/dates';
import { formatTime, toMinutes } from '../../utils/time';
import { AppButton } from '../ui/AppButton';
import { DialogCard } from '../ui/DialogCard';
import { FieldGroup, FieldLabel, FormInput, PickerField } from '../ui/FormField';
import { useToast } from '../ui/Toast';
import { InviteFriendsList } from './InviteFriendsList';
import { LocationField } from './LocationField';
import { RepeatSelect } from './RepeatSelect';

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

function plusOneHour(time: TimeOfDay): TimeOfDay {
  const m = Math.min(toMinutes(time) + 60, 23 * 60 + 59);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

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
  const [start, setStart] = useState<TimeOfDay | null>(null);
  const [end, setEnd] = useState<TimeOfDay | null>(null);
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

  const invitedNames = friends.filter((f) => invited.includes(f.id)).map((f) => f.name.split(' ')[0]);

  const onPicked = (kind: PickerKind, value: Date) => {
    setPicker(null);
    setError(null);
    if (kind === 'date') return setDate(toISODate(value));
    const time = dateToTime(value);
    if (kind === 'start') {
      setStart(time);
      // "To" automático: 1 hora depois (se ainda não escolhido ou ficou antes do início).
      if (!end || toMinutes(end) <= toMinutes(time)) setEnd(plusOneHour(time));
    } else {
      setEnd(time);
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
    if (!start || !end) return setError('Choose when it starts and ends.');
    if (toMinutes(end) <= toMinutes(start)) return setError('The end time must be after the start time.');

    const draft: EventDraft = { name: name.trim(), location: location.trim(), buildingId, date, start, end, repeat };
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

  const pickerValue = picker === 'date' ? parseISODate(date) : timeToDate(picker === 'end' ? end : start);

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
            when={start && end ? { date, start, end } : null}
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
              onPress={() => setPicker('date')}
              accessibilityLabel="Select day"
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Hour</FieldLabel>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.subLabel}>From</Text>
                <PickerField
                  value={start && formatTime(start)}
                  placeholder="Select time"
                  icon={Clock}
                  onPress={() => setPicker('start')}
                  accessibilityLabel="Start time"
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.subLabel}>To</Text>
                <PickerField
                  value={end && formatTime(end)}
                  placeholder="Select time"
                  icon={Clock}
                  onPress={() => setPicker('end')}
                  accessibilityLabel="End time"
                />
              </View>
            </View>
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

      {picker && (
        <DateTimePicker
          value={pickerValue}
          mode={picker === 'date' ? 'date' : 'time'}
          minimumDate={picker === 'date' ? parseISODate(today) : undefined}
          onValueChange={(_, value) => onPicked(picker, value)}
          onDismiss={() => setPicker(null)}
        />
      )}
    </DialogCard>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 12 },
    flex: { flex: 1 },
    subLabel: { fontFamily: fonts.medium, fontSize: 13, color: c.muted, marginBottom: 8 },
    bigGap: { marginTop: 32 },
    smallGap: { marginTop: 12 },
    footer: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, marginTop: 8 },
  });
