import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { MapStyleElement } from 'react-native-maps';
import { colors, darkColors, mixHex, type Palette } from './colors';
import { MAP_LOOK } from '../config';
import { campusMapStyle, campusMapStyleDark, googleCleanMapStyle } from './mapStyle';

/**
 * Tema claro/escuro do app inteiro (escolhido em Settings).
 *
 * Em qualquer componente:
 *   const { colors, isDark, tint, vivid } = useAppTheme();   // paleta do mapa/filtros (mesmas chaves de colors.ts)
 *   const { c } = useAppTheme();                              // paleta das telas Schedule/Settings (AppColors)
 *   const styles = useThemedStyles(makeStyles);               // estilos recalculados ao trocar o modo
 */

/** Cores das telas Schedule/Settings e popups (Figma "Settings · Light mode" / "Dark mode"). */
export interface AppColors {
  page: string; // fundo da tela
  card: string; // cards, popups, botão "Back"
  cardBorder: string;
  text: string; // títulos
  muted: string; // subtítulos, labels
  placeholder: string;
  field: string; // fundo dos campos de texto
  fieldBorder: string;
  accent: string; // botões principais (Done, Save changes, +)
  onAccent: string; // texto sobre accent
  accentSoft: string; // "Edit name & email", "Cancel", aba selecionada
  accentSoftText: string;
  mint: string; // "Invite friends" sem ninguém
  switchOff: string;
  switchOn: string;
  overlay: string; // fundo escurecido atrás dos popups
  weekend: string; // colunas sáb/dom da semana
  gridLine: string;
  nowLine: string; // linha vermelha do "agora" na Week View
  success: string; // "Free" nos convites
  error: string;
}

const light: AppColors = {
  page: colors.page,
  card: colors.surface,
  cardBorder: '#E6E3D8',
  text: colors.ink,
  muted: '#65736D',
  placeholder: '#78837D',
  field: colors.page,
  fieldBorder: '#E6E3D8',
  accent: colors.forest,
  onAccent: colors.surface,
  accentSoft: colors.greenTint,
  accentSoftText: colors.forest,
  mint: colors.mint,
  switchOff: '#D5DDCF',
  switchOn: '#83A37C',
  overlay: 'rgba(35, 58, 67, 0.22)',
  weekend: '#F2F1E9',
  gridLine: '#E6E3D8',
  nowLine: '#D93025',
  success: colors.green,
  error: colors.error,
};

const dark: AppColors = {
  page: '#1E2B28',
  card: '#293A33',
  cardBorder: '#46594F',
  text: '#F4F2E9',
  muted: '#BDC9BD',
  placeholder: '#8E9C93',
  field: '#22322D',
  fieldBorder: '#3B4E45',
  accent: '#83A37C',
  onAccent: '#1E2B28',
  accentSoft: '#354C3D',
  accentSoftText: '#C9DDBE',
  mint: '#4F7F68',
  switchOff: '#3B4E45',
  switchOn: '#83A37C',
  overlay: 'rgba(0, 0, 0, 0.5)',
  weekend: '#24332F',
  gridLine: '#33463E',
  nowLine: '#F28B82',
  success: '#9CC59A',
  error: '#E0907C',
};

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  /** Paleta do mapa, filtros e componentes (mesmas chaves de `colors`). */
  colors: Palette;
  /** Paleta das telas Schedule/Settings e popups. */
  c: AppColors;
  /** Estilo do Google Maps (padrão do Google ou bege no claro — ver MAP_LOOK em config.ts; verde escuro no escuro). */
  mapStyle: MapStyleElement[];
  /** Fundo suave de uma cor (mistura com o `surface` do tema atual). */
  tint: (hex: string, amount?: number) => string;
  /** Cor de dado (amigo, categoria) mais clara no escuro, para aparecer sobre o mapa escuro. */
  vivid: (hex: string) => string;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  /** Cor de um curso para fundo de bloco/chip (clarinha no modo claro, escura no escuro). */
  courseBg: (color: string) => string;
  /** Cor de um curso para texto (legível nos dois modos). */
  courseText: (color: string) => string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Guarda o modo claro/escuro escolhido em Settings (em memória; some ao fechar o app). */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = mode === 'dark';
    const c = isDark ? dark : light;
    const palette = isDark ? darkColors : colors;
    return {
      mode,
      isDark,
      colors: palette,
      c,
      mapStyle: isDark ? campusMapStyleDark : MAP_LOOK === 'google' ? googleCleanMapStyle : campusMapStyle,
      tint: (hex, amount = 0.12) => mixHex(hex, palette.surface, isDark ? Math.min(1, amount * 2.2) : amount),
      vivid: (hex) => (isDark ? mixHex(hex, '#FFFFFF', 0.62) : hex),
      setMode,
      toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
      courseBg: (color) => mixHex(color, c.card, isDark ? 0.35 : 0.16),
      courseText: (color) => (isDark ? mixHex(color, '#FFFFFF', 0.45) : color),
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme() must be used inside <ThemeProvider> (see App.tsx)');
  return ctx;
}

/**
 * Cria os estilos com as cores do tema atual (e recria só quando o modo muda).
 * Uso: `const makeStyles = (colors: Palette) => StyleSheet.create({...})` fora do componente
 * e `const styles = useThemedStyles(makeStyles)` dentro.
 */
export function useThemedStyles<T>(factory: (colors: Palette) => T): T {
  const { colors: palette } = useAppTheme();
  return useMemo(() => factory(palette), [factory, palette]);
}
