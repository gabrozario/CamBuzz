import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Checkbox } from '../../components/Checkbox';
import { colors, fonts, radius, tint } from '../../theme';
import type { PersonDay } from './peopleDay';

interface Props {
  day: PersonDay;
  checked: boolean;
  onToggle: () => void;
}

/** Linha da lista People: checkbox na cor da pessoa, nome, status e "Next: ..." (Figma). */
export function PersonRow({ day, checked, onToggle }: Props) {
  const { person, status, next } = day;
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [styles.row, checked && { backgroundColor: tint(person.color, 0.1) }, pressed && styles.pressed]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={`${checked ? 'Hide' : 'Show'} ${person.isMe ? 'your' : `${person.shortName}'s`} route`}
    >
      <Checkbox checked={checked} color={person.color} />
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text style={styles.name} numberOfLines={1}>
            {person.name}
          </Text>
          {checked && next ? (
            <Text style={[styles.next, { color: person.color }]} numberOfLines={1}>
              {next}
            </Text>
          ) : (
            !checked && <View style={[styles.swatch, { backgroundColor: person.color }]} />
          )}
        </View>
        <Text style={styles.status} numberOfLines={1}>
          {status}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 16,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  pressed: { opacity: 0.75 },
  body: { flex: 1, gap: 3 },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 17, color: colors.ink },
  next: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 11, textAlign: 'right' },
  swatch: { width: 26, height: 4, borderRadius: 2, marginRight: 4 },
  status: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
});
