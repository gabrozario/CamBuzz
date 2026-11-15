import { Plus } from 'lucide-react-native';
import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useAppTheme, type AppColors } from '../../theme';

interface Props {
  visible: boolean;
  /** Distância do fundo da tela até o topo do botão "+" (o menu abre logo acima dele). */
  bottom: number;
  onClose: () => void;
  onAddCourse: () => void;
  onAddEvent: () => void;
}

/** Menu do botão "+" (Figma "Schedule · Add menu"): "+ Add Course" / "+ Add Event". */
export function AddMenu({ visible, bottom, onClose, onAddCourse, onAddEvent }: Props) {
  const { c } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  const item = (label: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Plus size={18} color={c.accentSoftText} strokeWidth={2.4} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close menu" />
      <View style={[styles.menu, { bottom }]}>
        {item('Add Course', onAddCourse)}
        <View style={styles.divider} />
        {item('Add Event', onAddEvent)}
      </View>
    </Modal>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: c.overlay },
    menu: {
      position: 'absolute',
      left: 20,
      width: 220,
      backgroundColor: c.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.cardBorder,
      paddingHorizontal: 16,
    },
    item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 20, paddingHorizontal: 8 },
    label: { fontFamily: fonts.semibold, fontSize: 17, color: c.accentSoftText },
    divider: { height: 1, backgroundColor: c.cardBorder },
  });
