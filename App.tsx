// Importamos cada peso separadamente para não empacotar os 18 pesos da Inter.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { IntroVideo } from './src/components/IntroVideo';
import { ToastProvider } from './src/components/ui/Toast';
import { AuthFlow } from './src/screens/auth/AuthFlow';
import { RootScreen } from './src/screens/RootScreen';
import { AuthProvider, useAuth } from './src/services/auth/AuthProvider';
import { FriendsProvider } from './src/services/friends/FriendsProvider';
import { ScheduleProvider } from './src/services/schedule/ScheduleProvider';
import { colors, ThemeProvider, useAppTheme } from './src/theme';

export default function App() {
  // Carrega a fonte Inter (a do Figma). Enquanto carrega, mostra só o fundo.
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  // Vídeo de abertura (toda vez que o app abre). O app carrega por baixo enquanto ele toca.
  const [introDone, setIntroDone] = useState(false);

  return (
    // GestureHandlerRootView é exigido pelo @gorhom/bottom-sheet (usado nas próximas etapas).
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {/* Providers = dados compartilhados entre as telas: tema, conta, amigos, agenda e avisos. */}
        <ThemeProvider>
          <AuthProvider>
            <FriendsProvider>
              <ScheduleProvider>
                <ToastProvider>{fontsLoaded ? <Root /> : <View style={styles.root} />}</ToastProvider>
              </ScheduleProvider>
            </FriendsProvider>
          </AuthProvider>
        </ThemeProvider>
        {!introDone && <IntroVideo onDone={() => setIntroDone(true)} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Escolhe a tela inicial: logado (sessão salva) ou convidado → app (mapa, agenda, settings);
 * senão → boas-vindas. Enquanto lê a sessão salva, mostra só o fundo (é bem rápido).
 */
function Root() {
  const { status } = useAuth();
  const theme = useAppTheme();
  if (status === 'loading') return <View style={[styles.root, { backgroundColor: theme.colors.mapBackground }]} />;
  if (status === 'signedIn' || status === 'guest') return <RootScreen />;
  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <AuthFlow />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mapBackground },
});
