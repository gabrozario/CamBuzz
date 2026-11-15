import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthMethod, AuthUser } from '../../types';
import { authService, type AuthResult } from './authService';

/**
 * - loading:  lendo a sessão salva (logo ao abrir o app)
 * - signedOut: ninguém logado → tela de boas-vindas
 * - signedIn: conta logada (sessão salva no celular → abre direto no mapa na próxima vez)
 * - guest:    convidado (NÃO é salvo → na próxima vez volta a tela de boas-vindas)
 */
export type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'guest';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  logIn: (email: string, password: string) => Promise<AuthResult>;
  logInWithProvider: (provider: Exclude<AuthMethod, 'email'>) => Promise<AuthResult>;
  continueAsGuest: () => void;
  /** Sai da conta (ou do modo convidado) e volta para a tela de boas-vindas. */
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Guarda quem está logado; qualquer tela lê com `useAuth()`. Fica em volta do app (App.tsx). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    authService.restoreSession().then((saved) => {
      setUser(saved);
      setStatus(saved ? 'signedIn' : 'signedOut');
    });
  }, []);

  /** Aplica o resultado de um login/cadastro bem-sucedido. */
  const handle = useCallback((result: AuthResult) => {
    if (result.ok) {
      setUser(result.user);
      setStatus('signedIn');
    }
    return result;
  }, []);

  const signUp = useCallback(
    (name: string, email: string, password: string) => authService.signUp(name, email, password).then(handle),
    [handle],
  );
  const logIn = useCallback(
    (email: string, password: string) => authService.logIn(email, password).then(handle),
    [handle],
  );
  const logInWithProvider = useCallback(
    (provider: Exclude<AuthMethod, 'email'>) => authService.logInWithProvider(provider).then(handle),
    [handle],
  );
  const continueAsGuest = useCallback(() => {
    setUser(null);
    setStatus('guest');
  }, []);
  const logOut = useCallback(async () => {
    await authService.logOut();
    setUser(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo(
    () => ({ status, user, signUp, logIn, logInWithProvider, continueAsGuest, logOut }),
    [status, user, signUp, logIn, logInWithProvider, continueAsGuest, logOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() must be used inside <AuthProvider> (see App.tsx)');
  return ctx;
}
