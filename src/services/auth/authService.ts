import AsyncStorage from '@react-native-async-storage/async-storage';
import { me } from '../../../data';
import type { AuthMethod, AuthUser } from '../../types';
import { isValidEmail, normalizeEmail } from '../friends/invite';

export type AuthResult = { ok: true; user: AuthUser } | { ok: false; error: string };

/**
 * Tudo o que o app precisa do "backend" de contas.
 * Hoje: mockAuthService (contas guardadas só no celular, SEM senha de verdade).
 * Futuro: criar apiAuthService (fetch para o servidor + expo-auth-session para
 * Google/Microsoft) com as MESMAS funções e trocar `authService` lá embaixo.
 */
export interface AuthService {
  /** Sessão salva no celular (null = ninguém logado). Chamado ao abrir o app. */
  restoreSession(): Promise<AuthUser | null>;
  signUp(name: string, email: string, password: string): Promise<AuthResult>;
  logIn(email: string, password: string): Promise<AuthResult>;
  logInWithProvider(provider: Exclude<AuthMethod, 'email'>): Promise<AuthResult>;
  logOut(): Promise<void>;
}

export const MIN_PASSWORD_LENGTH = 8;

// Chaves do AsyncStorage (armazenamento simples do celular, continua lá ao fechar o app).
const SESSION_KEY = 'cambuzz.session';
const ACCOUNTS_KEY = 'cambuzz.mockAccounts';

// ---------------- Implementação falsa ----------------

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Conta de demonstração que já "existe" (o usuário de data/me.json). */
const DEMO_ACCOUNT: AuthUser = { id: me.id, name: me.name, email: me.email, method: 'email' };

async function readAccounts(): Promise<AuthUser[]> {
  const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
  const saved: AuthUser[] = raw ? JSON.parse(raw) : [];
  return saved.some((a) => a.email === DEMO_ACCOUNT.email) ? saved : [DEMO_ACCOUNT, ...saved];
}

async function saveSession(user: AuthUser): Promise<AuthResult> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return { ok: true, user };
}

export const mockAuthService: AuthService = {
  async restoreSession() {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null; // armazenamento corrompido → volta para a tela de boas-vindas
    }
  },

  async signUp(name, email, password) {
    await wait(400);
    const cleanName = name.trim();
    const cleanEmail = normalizeEmail(email);
    if (!cleanName) return { ok: false, error: 'Please enter your name.' };
    if (!isValidEmail(cleanEmail)) return { ok: false, error: 'Please enter a valid email.' };
    if (password.length < MIN_PASSWORD_LENGTH)
      return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };

    const accounts = await readAccounts();
    if (accounts.some((a) => a.email === cleanEmail))
      return { ok: false, error: 'An account with this email already exists. Try logging in.' };

    // A senha NÃO é guardada no mock — quem vai conferir senha é o backend.
    const user: AuthUser = { id: `user-${Date.now()}`, name: cleanName, email: cleanEmail, method: 'email' };
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, user]));
    return saveSession(user);
  },

  async logIn(email, password) {
    await wait(400);
    const cleanEmail = normalizeEmail(email);
    if (!isValidEmail(cleanEmail)) return { ok: false, error: 'Please enter a valid email.' };
    if (!password) return { ok: false, error: 'Please enter your password.' };

    const account = (await readAccounts()).find((a) => a.email === cleanEmail);
    if (!account) return { ok: false, error: 'No account found with this email. Want to sign up?' };
    return saveSession(account);
  },

  async logInWithProvider(provider) {
    // Simula a janela do Google/Microsoft: entra com a conta de demonstração.
    await wait(700);
    return saveSession({ ...DEMO_ACCOUNT, method: provider });
  },

  async logOut() {
    await AsyncStorage.removeItem(SESSION_KEY);
  },
};

/** Troque aqui quando existir backend. */
export const authService: AuthService = mockAuthService;
