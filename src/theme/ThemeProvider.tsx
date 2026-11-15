import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { MapStyleElement } from 'react-native-maps';
import { colors, darkColors, gt, legibleOn, mixHex, readableOn, type Palette } from './colors';
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
  weekendLine: string; // linhas da grade só dentro das colunas sáb/dom
  gridEdge: string; // borda direita da grade (depois de domingo)
  gridLine: string;
  nowLine: string; // linha vermelha do "agora" na Week View
  success: string; // "Free" nos convites
  error: string;
}

const light: AppColors = {
  page: colors.page, // diploma
  card: colors.surface, // branco
  cardBorder: colors.border,
  text: colors.ink, // navy
  muted: colors.muted,
  placeholder: '#7A8796', // navy 55% + branco
  field: colors.page,
  fieldBorder: colors.border,
  accent: gt.navy,
  onAccent: gt.white,
  accentSoft: colors.greenTint, // gold clarinho
  accentSoftText: gt.navy,
  mint: gt.buzz,
  switchOff: '#E1D3B9', // gold 40% + branco
  switchOn: gt.buzz,
  overlay: 'rgba(5, 30, 57, 0.28)', // navy
  weekend: '#FFFDF7', // buzz 3% + branco: amarelinho quase branco, mais claro que o diploma da tela
  weekendLine: '#ECE3D4', // gold 25% + branco: um pouco mais escura que a coluna, sem contrastar demais
  gridEdge: '#F1E9DC', // gold 20% + branco
  gridLine: colors.divider,
  nowLine: '#D93025', // linha vermelha do "agora" (exceção funcional, igual ao Google Calendar)
  success: colors.green,
  error: colors.error,
};

const dark: AppColors = {
  page: gt.navy,
  card: darkColors.surface,
  cardBorder: darkColors.border,
  text: gt.diploma,
  muted: darkColors.muted,
  placeholder: darkColors.subtle,
  field: '#112840', // navy 95% + branco
  fieldBorder: darkColors.border,
  accent: gt.buzz,
  onAccent: gt.navy,
  accentSoft: darkColors.greenTint,
  accentSoftText: '#D9C49C', // gold 60% + branco
  mint: gt.darkGold,
  switchOff: darkColors.border,
  switchOn: gt.buzz,
  overlay: 'rgba(0, 0, 0, 0.5)',
  weekend: '#18304A',
  weekendLine: darkColors.divider,
  gridEdge: darkColors.border,
  gridLine: darkColors.divider,
  nowLine: '#F28B82',
  success: gt.buzz,
  error: darkColors.error,
};

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  /** Paleta do mapa, filtros e componentes (mesmas chaves de `colors`). */
  colors: Palette;
  /** Paleta das telas Schedule/Settings e popups. */
  c: AppColors;
  /** Estilo do Google Maps (padrão do Google ou bege no claro — ver MAP_LOOK em config.ts; navy no escuro). */
  mapStyle: MapStyleElement[];
  /** Fundo suave de uma cor (mistura com o `surface` do tema atual). */
  tint: (hex: string, amount?: number) => string;
  /** Cor de dado (amigo, categoria) mais clara no escuro, para aparecer sobre o mapa escuro. */
  vivid: (hex: string) => string;
  /** Cor de dado (buzz, gold...) ajustada para ser LIDA como texto sobre os cards do tema atual. */
  legible: (hex: string) => string;
  /** Texto/ícone (branco ou navy) legível SOBRE um fundo dessa cor (pinos, checkboxes, avatares). */
  readableOn: (bg: string) => string;
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
      legible: (hex) => legibleOn(hex, palette.surface),
      readableOn,
      setMode,
      toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
      courseBg: (color) => mixHex(color, c.card, isDark ? 0.35 : 0.16),
      courseText: (color) => legibleOn(isDark ? mixHex(color, '#FFFFFF', 0.45) : color, c.card),
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
