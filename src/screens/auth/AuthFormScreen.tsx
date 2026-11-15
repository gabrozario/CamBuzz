import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { me } from '../../../data';
import { AuthButton } from '../../components/auth/AuthButton';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { GoogleLogo, MicrosoftLogo } from '../../components/auth/ProviderLogos';
import { IconButton } from '../../components/IconButton';
import { useAuth } from '../../services/auth/AuthProvider';
import type { AuthResult } from '../../services/auth/authService';
import { MIN_PASSWORD_LENGTH } from '../../services/auth/authService';
import { fonts, useAppTheme, useThemedStyles, type Palette } from '../../theme';

export type AuthFormMode = 'signup' | 'login';

interface Props {
  mode: AuthFormMode;
  onBack: () => void;
  /** Troca entre "Sign up" e "Log in" (link no fim da tela). */
  onSwitchMode: () => void;
}

/** O que está carregando agora (para mostrar o "girando" só no botão tocado). */
type Pending = 'email' | 'google' | 'microsoft' | null;

/** Tela de cadastro OU login: Google/Microsoft em cima, email e senha embaixo. */
export function AuthFormScreen({ mode, onBack, onSwitchMode }: Props) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { signUp, logIn, logInWithProvider } = useAuth();
  const isSignUp = mode === 'signup';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  /** Roda o login/cadastro; se der certo, o AuthProvider troca para o mapa sozinho. */
  const run = async (which: Exclude<Pending, null>, action: () => Promise<AuthResult>) => {
    setError(null);
    setPending(which);
    const result = await action();
    if (!result.ok) {
      setError(result.error);
      setPending(null);
    }
  };

  const submit = () =>
    run('email', () => (isSignUp ? signUp(name, email, password) : logIn(email, password)));

  const busy = pending !== null;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <IconButton icon={ChevronLeft} accessibilityLabel="Back" onPress={onBack} />

        <Text style={styles.title}>{isSignUp ? 'Create your account' : 'Welcome back'}</Text>
        <Text style={styles.subtitle}>
          {isSignUp
            ? 'Save your class schedule and see your day on the map.'
            : 'Log in to pick up your schedule where you left it.'}
        </Text>

        <View style={styles.providers}>
          <AuthButton
            label="Continue with Google"
            variant="secondary"
            icon={<GoogleLogo />}
            loading={pending === 'google'}
            disabled={busy}
            onPress={() => run('google', () => logInWithProvider('google'))}
          />
          <AuthButton
            label="Continue with Microsoft"
            variant="secondary"
            icon={<MicrosoftLogo />}
            loading={pending === 'microsoft'}
            disabled={busy}
            onPress={() => run('microsoft', () => logInWithProvider('microsoft'))}
          />
        </View>

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or with email</Text>
          <View style={styles.orLine} />
        </View>

        <View style={styles.fields}>
          {isSignUp && (
            <AuthTextField
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Alex Morgan"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
            />
          )}
          <AuthTextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@gatech.edu"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
          />
          <AuthTextField
            label="Password"
            password
            value={password}
            onChangeText={setPassword}
            placeholder={isSignUp ? `At least ${MIN_PASSWORD_LENGTH} characters` : 'Your password'}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            textContentType={isSignUp ? 'newPassword' : 'password'}
            returnKeyType="go"
            onSubmitEditing={submit}
          />
        </View>

        {error && (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        )}

        <View style={styles.submit}>
          <AuthButton
            label={isSignUp ? 'Create account' : 'Log in'}
            loading={pending === 'email'}
            disabled={busy}
            onPress={submit}
          />
        </View>

        <Pressable onPress={onSwitchMode} hitSlop={8} style={styles.switchRow} accessibilityRole="button">
          <Text style={styles.switchText}>
            {isSignUp ? 'Already have an account? ' : 'New to CamBuzz? '}
            <Text style={styles.switchLink}>{isSignUp ? 'Log in' : 'Create an account'}</Text>
          </Text>
        </Pressable>

        <Text style={styles.demoNote}>
          Demo build · Google and Microsoft sign-in are simulated
          {isSignUp ? '' : `\nTry ${me.email} with any password`}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 24 },
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.ink, marginTop: 24 },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.muted, marginTop: 6 },
  providers: { gap: 12, marginTop: 28 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { fontFamily: fonts.regular, fontSize: 13, color: colors.subtle },
  fields: { gap: 16 },
  error: { fontFamily: fonts.medium, fontSize: 14, color: colors.error, marginTop: 14 },
  submit: { marginTop: 24 },
  switchRow: { alignSelf: 'center', marginTop: 20 },
  switchText: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  switchLink: { fontFamily: fonts.semibold, color: colors.green },
  demoNote: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.subtle, textAlign: 'center', marginTop: 28 },
});
