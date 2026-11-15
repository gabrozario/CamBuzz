import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButton } from '../../components/auth/AuthButton';
import { fonts, useAppTheme, useThemedStyles, type Palette } from '../../theme';

interface Props {
  onSignUp: () => void;
  onLogIn: () => void;
  onGuest: () => void;
}

/** Largura máxima do logo na tela (a altura segue a proporção do arquivo, 1200 × 312). */
const LOGO_MAX_WIDTH = 320;
/** Margem do cartão (24 de cada lado) — o logo nunca passa dela em celulares estreitos. */
const CARD_PADDING = 24;

/** Primeira tela (quando ninguém está logado): foto aérea do Tech Tower + logo centralizado + botões. */
export function WelcomeScreen({ onSignUp, onLogIn, onGuest }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { isDark } = useAppTheme();
  // Logo do tamanho que couber (até 320 dp).
  const { width: screenWidth } = useWindowDimensions();
  const logoW = Math.min(LOGO_MAX_WIDTH, screenWidth - CARD_PADDING * 2);
  const logoH = logoW * (312 / 1200);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      {/* Foto aérea do Tech Tower (assets/TechTowerBirdview.jpg): "cover" preenche o topo e mantém o prédio no centro. */}
      <View style={styles.art}>
        <Image
          source={require('../../../assets/TechTowerBirdview.jpg')}
          style={styles.photo}
          resizeMode="cover"
          accessibilityLabel="Aerial view of Tech Tower in the fall"
        />
      </View>

      <View style={[styles.card, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.eyebrow}>GEORGIA TECH · CAMPUS MAP</Text>
        {/* Logo oficial centralizado (assets/cambuzz_logo.svg em PNG; versão clara no modo escuro). */}
        <Image
          source={isDark ? require('../../../assets/cambuzz_logo_dark.png') : require('../../../assets/cambuzz_logo.png')}
          style={[styles.logo, { width: logoW, height: logoH }]}
          resizeMode="contain"
          accessibilityRole="header"
          accessibilityLabel="CamBuzz"
        />
        <Text style={styles.body}>Your Day on One Map</Text>

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

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mapBackground },
  art: { flex: 1, minHeight: 200, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  card: {
    marginTop: -28,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    shadowColor: '#051E39',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.5, color: colors.gold },
  // Logo centralizado no cartão (tamanho calculado no componente, conforme a largura da tela).
  // translateY sobe só o logo, sem puxar o slogan e os botões (o resto fica no mesmo lugar).
  logo: { alignSelf: 'center', marginTop: 14, transform: [{ translateY: -10 }] },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted, marginTop: 10 },
  buttons: { gap: 12, marginTop: 24 },
  footnote: { fontFamily: fonts.regular, fontSize: 12, color: colors.subtle, textAlign: 'center', marginTop: 4 },
});
