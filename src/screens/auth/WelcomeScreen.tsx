import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButton } from '../../components/auth/AuthButton';
import { WelcomeIllustration } from '../../components/auth/WelcomeIllustration';
import { colors, fonts } from '../../theme';

interface Props {
  onSignUp: () => void;
  onLogIn: () => void;
  onGuest: () => void;
}

/** Primeira tela (quando ninguém está logado): mapa ilustrado + "Welcome to CamBuzz" + botões. */
export function WelcomeScreen({ onSignUp, onLogIn, onGuest }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={styles.art}>
        <WelcomeIllustration />
      </View>

      <View style={[styles.card, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.eyebrow}>GEORGIA TECH · CAMPUS MAP</Text>
        <Text style={styles.title}>Welcome to{'\n'}CamBuzz</Text>
        <Text style={styles.body}>
          Your day on one map: the walk between classes, events on your way, food nearby and where your friends are.
        </Text>

        <View style={styles.buttons}>
          <AuthButton label="Create account" onPress={onSignUp} />
          <AuthButton label="Log in" variant="secondary" onPress={onLogIn} />
          <AuthButton label="Continue as guest" variant="text" onPress={onGuest} />
        </View>

        <Text style={styles.footnote}>Guests can explore the map · Log in to save your schedule</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mapBackground },
  art: { flex: 1, minHeight: 200 },
  card: {
    marginTop: -28,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.5, color: colors.gold },
  title: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 40, color: colors.ink, marginTop: 10 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted, marginTop: 10 },
  buttons: { gap: 12, marginTop: 24 },
  footnote: { fontFamily: fonts.regular, fontSize: 12, color: colors.subtle, textAlign: 'center', marginTop: 4 },
});
