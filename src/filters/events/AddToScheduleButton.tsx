import { Check, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text } from 'react-native';
import { useToast } from '../../components/ui/Toast';
import { confirmConflicts } from '../../services/schedule/confirmConflicts';
import { useSchedule } from '../../services/schedule/ScheduleProvider';
import { fonts, radius, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import type { CampusEvent, EventDraft } from '../../types';

/**
 * "Add to schedule" no detalhe de um evento: coloca o evento na SUA agenda de hoje
 * (com a checagem de conflito de sempre). Depois vira "Added" — tocar de novo oferece tirar.
 */
export function AddToScheduleButton({ event }: { event: CampusEvent }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { schedule, today, conflictsFor, addEvent, removeEvent } = useSchedule();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  // Já está na agenda de hoje? (o evento adicionado guarda de qual evento do campus veio)
  const added = schedule.events.find((e) => e.campusEventId === event.id && e.date === today);

  const add = async () => {
    const draft: EventDraft = {
      name: event.name,
      location: event.locationName,
      buildingId: event.buildingId,
      coordinate: event.coordinate, // eventos ao ar livre não têm prédio, mas têm posição
      date: today,
      start: event.start,
      end: event.end,
      repeat: 'none',
      campusEventId: event.id,
    };
    const conflicts = conflictsFor({ type: 'event', draft });
    const choice = await confirmConflicts(conflicts, event.name);
    if (choice === 'cancel') return;
    setBusy(true);
    const result = await addEvent(draft, [], choice === 'replace' ? conflicts : undefined);
    setBusy(false);
    toast(result.ok ? `${event.name} added to your schedule` : result.error);
  };

  const remove = () => {
    if (!added) return;
    Alert.alert('Remove from your schedule?', event.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeEvent(added.id);
          toast(`${event.name} removed from your schedule`);
        },
      },
    ]);
  };

  return (
    <Pressable
      onPress={added ? remove : add}
      disabled={busy}
      hitSlop={8}
      style={({ pressed }) => [styles.button, added && styles.added, pressed && { opacity: 0.75 }]}
      accessibilityRole="button"
      accessibilityLabel={added ? `${event.name} is on your schedule. Tap to remove` : `Add ${event.name} to your schedule`}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.surface} />
      ) : added ? (
        <Check size={15} color={colors.green} strokeWidth={2.6} />
      ) : (
        <Plus size={15} color={colors.surface} strokeWidth={2.6} />
      )}
      <Text style={[styles.text, added && styles.addedText]}>{added ? 'Added' : 'Add to schedule'}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.green,
    },
    added: { backgroundColor: colors.greenSoft },
    text: { fontFamily: fonts.semibold, fontSize: 13, color: colors.surface },
    addedText: { color: colors.green },
  });
