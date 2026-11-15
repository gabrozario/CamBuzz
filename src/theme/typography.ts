import { colors } from './colors';

// Fontes da identidade visual da GT (carregadas em App.tsx via @expo-google-fonts):
//   - Roboto Slab (negrito) → títulos e todo texto em negrito (semibold / bold)
//   - Roboto               → todo o resto (texto normal e medium)
// No React Native, cada peso é uma "família" diferente, por isso usamos fontFamily
// em vez de fontWeight. Nunca use fontWeight: escolha uma destas chaves.

export const fonts = {
  regular: 'Roboto_400Regular',
  medium: 'Roboto_500Medium',
  semibold: 'RobotoSlab_600SemiBold',
  bold: 'RobotoSlab_700Bold',
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
