import { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { useAuth } from '../../services/auth/AuthProvider';
import { AuthFormScreen, type AuthFormMode } from './AuthFormScreen';
import { WelcomeScreen } from './WelcomeScreen';

/**
 * Telas de quem NÃO está logado: boas-vindas → cadastro / login.
 * (Sem biblioteca de navegação: só um estado dizendo qual tela mostrar.)
 */
export function AuthFlow() {
  const { continueAsGuest } = useAuth();
  const [screen, setScreen] = useState<'welcome' | AuthFormMode>('welcome');

  // Botão "voltar" do Android: do formulário volta para as boas-vindas.
  useEffect(() => {
    if (screen === 'welcome') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setScreen('welcome');
      return true;
    });
    return () => sub.remove();
  }, [screen]);

  if (screen === 'welcome') {
    return (
      <WelcomeScreen
        onSignUp={() => setScreen('signup')}
        onLogIn={() => setScreen('login')}
        onGuest={continueAsGuest}
      />
    );
  }

  return (
    <AuthFormScreen
      key={screen} // limpa os campos ao trocar entre cadastro e login
      mode={screen}
      onBack={() => setScreen('welcome')}
      onSwitchMode={() => setScreen(screen === 'signup' ? 'login' : 'signup')}
    />
  );
}
