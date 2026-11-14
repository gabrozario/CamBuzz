export * from './colors';
export * from './typography';
export * from './mapStyle';

export const radius = { sm: 10, md: 16, lg: 20, pill: 999 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

// Sombra suave usada nos botões flutuantes e cards sobre o mapa.
export const shadow = {
  shadowColor: '#233A43',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
} as const;
