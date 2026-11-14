import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow } from '../theme';

interface Props {
  label: string;
  color?: string;
}

/** Chip branco de informação sobre o mapa (ex.: "Your day · Today · 11:15 AM"). */
export function InfoChip({ label, color = colors.ink }: Props) {
  return (
    <View style={styles.chip}>
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
    ...shadow,
  },
  text: { fontFamily: fonts.semibold, fontSize: 13 },
});
