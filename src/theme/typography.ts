import { colors } from './colors';

// Fonte do design: Inter. Carregada em App.tsx via @expo-google-fonts/inter.
// No React Native, cada peso é uma "família" diferente, por isso usamos fontFamily
// em vez de fontWeight.

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

// Tamanhos aproximados do Figma (exportado em ~2x, então dividimos por 2).
export const text = {
  sheetTitle: { fontFamily: fonts.bold, fontSize: 26, color: colors.ink },
  itemTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  chip: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  navLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.muted },
  caption: { fontFamily: fonts.regular, fontSize: 12, color: colors.subtle },
} as const;
