import { CalendarPlus, GraduationCap, type LucideIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useAppTheme, type AppColors } from '../../theme';

interface Props {
  visible: boolean;
  /** Distância do fundo da tela até o TOPO do botão "+" (o menu abre acima dele, com um espaço). */
  bottom: number;
  onClose: () => void;
  onAddCourse: () => void;
  onAddEvent: () => void;
}

/** Espaço entre o topo do "+" e o menu (o menu nunca encosta no botão). */
const GAP_ABOVE_BUTTON = 14;

/** Menu do botão "+" (Figma "Schedule · Add menu"): Add Course / Add Event, compacto, acima do "+". */
export function AddMenu({ visible, bottom, onClose, onAddCourse, onAddEvent }: Props) {
  const { c } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  const item = (label: string, Icon: LucideIcon, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.iconCircle}>
        <Icon size={16} color={c.accentSoftText} strokeWidth={2} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close menu" />
      <View style={[styles.menu, { bottom: bottom + GAP_ABOVE_BUTTON }]}>
        {item('Add Course', GraduationCap, onAddCourse)}
        <View style={styles.divider} />
        {item('Add Event', CalendarPlus, onAddEvent)}
      </View>
    </Modal>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    // Fundo bem leve: o foco é o menu, sem escurecer a agenda inteira.
    backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0, 0, 0, 0.12)' },
    menu: {
      position: 'absolute',
      left: 18,
      width: 184,
      backgroundColor: c.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: 6,
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
        default: { elevation: 6 },
      }),
    },
    item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 8, borderRadius: 12 },
    itemPressed: { backgroundColor: c.accentSoft },
    iconCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: { fontFamily: fonts.semibold, fontSize: 15, color: c.text },
    divider: { height: 1, backgroundColor: c.cardBorder, marginHorizontal: 8, marginVertical: 2 },
  });
