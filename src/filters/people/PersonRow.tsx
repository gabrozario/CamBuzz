import { GripVertical, UserMinus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Checkbox } from '../../components/Checkbox';
import { fonts, radius, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import type { PersonDay } from './peopleDay';

interface Props {
  day: PersonDay;
  checked: boolean;
  onToggle: () => void;
  /** Se presente, mostra o botão de remover amigo (não aparece para "You"). */
  onRemove?: () => void;
  /** Mostra o "pegador" (⋮⋮): dá para segurar e arrastar para reordenar. */
  draggable?: boolean;
  /** Está sendo arrastado agora (fica "levantado"). */
  dragging?: boolean;
}

/** Linha da lista People: checkbox na cor da pessoa, nome, status e "Next: ..." (Figma). */
export function PersonRow({ day, checked, onToggle, onRemove, draggable = false, dragging = false }: Props) {
  const { colors, tint, legible } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { person, status, next } = day;
  return (
    <Pressable
      onPress={onToggle}
      // Segurar = começar a arrastar (não marca/desmarca o checkbox ao soltar).
      onLongPress={draggable ? () => {} : undefined}
      delayLongPress={300}
      style={({ pressed }) => [
        styles.row,
        checked && { backgroundColor: tint(person.color, 0.1) },
        dragging && styles.dragging,
        pressed && !dragging && styles.pressed,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={`${checked ? 'Hide' : 'Show'} ${person.isMe ? 'your' : `${person.shortName}'s`} route`}
    >
      {draggable && <GripVertical size={18} color={colors.subtle} strokeWidth={1.8} style={styles.grip} />}
      <Checkbox checked={checked} color={person.color} />
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text style={styles.name} numberOfLines={1}>
            {person.name}
          </Text>
          {checked && next ? (
            <Text style={[styles.next, { color: legible(person.color) }]} numberOfLines={1}>
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
      {onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${person.name} from friends`}
        >
          <UserMinus size={20} color={colors.muted} strokeWidth={1.8} />
        </Pressable>
      )}
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
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
  dragging: {
    backgroundColor: colors.surface,
    shadowColor: '#051E39',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  grip: { marginLeft: -6, marginRight: -6 },
  body: { flex: 1, gap: 3 },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 17, color: colors.ink },
  next: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 11, textAlign: 'right' },
  swatch: { width: 26, height: 4, borderRadius: 2, marginRight: 4 },
  status: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  removeBtn: { padding: 6, marginLeft: -4 },
});
