import { Bell } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../theme';

interface Props {
  /** Quantas notificações ainda não foram vistas (> 0 = bolinha vermelha). */
  unseen: number;
  onPress: () => void;
}

/** Cor da bolinha de "notificação nova" (vermelho clássico, chama atenção nos dois temas). */
const BADGE_RED = '#E5484D';

/** Sininho de notificações (aba Friends). Bolinha vermelha no canto = tem convite que você ainda não viu. */
export function NotificationBell({ unseen, onPress }: Props) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={unseen > 0 ? `Notifications, ${unseen} new` : 'Notifications'}
    >
      <Bell size={23} color={colors.ink} strokeWidth={1.8} />
      {unseen > 0 && <View style={[styles.badge, { borderColor: colors.surface }]} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { padding: 2 },
  badge: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: BADGE_RED,
  },
});
