// Importamos cada peso separadamente para não empacotar os 18 pesos da Inter.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthFlow } from './src/screens/auth/AuthFlow';
import { MapScreen } from './src/screens/MapScreen';
import { AuthProvider, useAuth } from './src/services/auth/AuthProvider';
import { FriendsProvider } from './src/services/friends/FriendsProvider';
import { colors } from './src/theme';

export default function App() {
  // Carrega a fonte Inter (a do Figma). Enquanto carrega, mostra só o fundo.
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  return (
    // GestureHandlerRootView é exigido pelo @gorhom/bottom-sheet (usado nas próximas etapas).
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <FriendsProvider>{fontsLoaded ? <Root /> : <View style={styles.root} />}</FriendsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Escolhe a tela inicial: logado (sessão salva) ou convidado → mapa; senão → boas-vindas.
 * Enquanto lê a sessão salva, mostra só o fundo (é bem rápido).
 */
function Root() {
  const { status } = useAuth();
  if (status === 'loading') return <View style={styles.root} />;
  if (status === 'signedIn' || status === 'guest') return <MapScreen />;
  return <AuthFlow />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mapBackground },
});
