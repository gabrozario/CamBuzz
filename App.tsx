// Importamos cada peso separadamente para não empacotar os 18 pesos da Inter.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useFonts } from 'expo-font';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from './src/components/ui/Toast';
import { RootScreen } from './src/screens/RootScreen';
import { FriendsProvider } from './src/services/friends/FriendsProvider';
import { ScheduleProvider } from './src/services/schedule/ScheduleProvider';
import { colors, ThemeProvider } from './src/theme';

export default function App() {
  // Carrega a fonte Inter (a do Figma). Enquanto carrega, mostra só o fundo.
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  return (
    // GestureHandlerRootView é exigido pelo @gorhom/bottom-sheet (usado nas próximas etapas).
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {/* Providers = dados compartilhados entre as telas: tema, amigos, agenda e avisos. */}
        <ThemeProvider>
          <FriendsProvider>
            <ScheduleProvider>
              <ToastProvider>{fontsLoaded ? <RootScreen /> : <View style={styles.root} />}</ToastProvider>
            </ScheduleProvider>
          </FriendsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mapBackground },
});
