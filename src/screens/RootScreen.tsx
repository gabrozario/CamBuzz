import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { EventInviteModal } from '../components/schedule/EventInviteModal';
import { useAppTheme } from '../theme';
import { MapScreen } from './MapScreen';
import { ScheduleScreen } from './ScheduleScreen';
import { SettingsScreen } from './SettingsScreen';

export type ScreenName = 'map' | 'schedule' | 'settings';

/**
 * "Navegação" simples do app, sem biblioteca:
 * o mapa fica sempre montado embaixo (não recarrega ao voltar) e as telas
 * My schedule / Settings aparecem por cima dele.
 */
export function RootScreen() {
  const [screen, setScreen] = useState<ScreenName>('map');
  const { isDark } = useAppTheme();

  // Botão "voltar" do Android numa tela por cima → volta para o mapa.
  // (Popups abertos tratam o voltar antes, pelo onRequestClose do Modal.)
  useEffect(() => {
    if (screen === 'map') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setScreen('map');
      return true;
    });
    return () => sub.remove();
  }, [screen]);

  const goMap = () => setScreen('map');

  return (
    <View style={styles.root}>
      {/* O mapa ainda não tem modo escuro, então a barra de status fica escura nele. */}
      <StatusBar style={screen !== 'map' && isDark ? 'light' : 'dark'} />
      <MapScreen
        focused={screen === 'map'}
        onOpenSchedule={() => setScreen('schedule')}
        onOpenSettings={() => setScreen('settings')}
      />
      {screen === 'schedule' && (
        <View style={styles.overlay}>
          <ScheduleScreen onOpenMap={goMap} />
        </View>
      )}
      {screen === 'settings' && (
        <View style={styles.overlay}>
          <SettingsScreen onBack={goMap} />
        </View>
      )}
      {/* Convite de evento de um amigo: aparece por cima de qualquer tela. */}
      <EventInviteModal />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});
