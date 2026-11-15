// Paleta extraída das imagens em /figma-designs (amostragem de pixels).
// Use SEMPRE estas constantes em vez de escrever cores "na mão" nos componentes.

export const colors = {
  // Texto / elementos escuros
  ink: '#233A43', // títulos, ícones, pinos numerados de eventos, "next leg"
  muted: '#6B776F', // subtítulos, texto secundário, ícones inativos
  subtle: '#9A9C8E', // nomes de rua, notas de rodapé

  // Superfícies
  surface: '#FFFEFA', // cards, botões flutuantes, barra inferior, bottom sheet
  border: '#E3E2D7', // borda da busca / cards
  divider: '#EEECE4', // separadores de lista
  handle: '#C7C9BF', // "pegador" do bottom sheet
  activeTab: '#EEE7D3', // fundo da aba selecionada na barra inferior

  // Mapa
  mapBackground: '#EEEDE2',
  mapRoad: '#FFFCF2',
  mapBuilding: '#DDD6C4',
  mapPark: '#D5DEC4',
  mapLabel: '#6D756A',
  mapWater: '#C9D8DC',

  // Cores de destaque (cada uma tem um significado no design)
  green: '#477969', // "You" (seu caminho), Printers, Restaurants/Coffees
  greenSoft: '#EEF3EC', // fundo de linha selecionada "You"
  gold: '#806C3C', // horários de eventos, categorias, Dining hall, Libraries
  purple: '#83608D', // amigo 1 (Maya)
  purpleSoft: '#F1EDF3',
  blue: '#526F8A', // amigo / Vending / Campus Rec / ponto de localização
  blueSoft: '#D7E3DF', // halo do ponto de localização

  // Popup "Add Friends" / Settings
  greenTint: '#E5EBDD', // caixa do link de convite, botão "Edit name & email"
  inputBorder: '#C2CCC0', // borda do campo de email
  checkboxBorder: '#9AA69B', // checkbox desmarcado (tela People)
  error: '#A4513F', // mensagens de erro (não aparece no Figma; tom terroso para combinar)

  // Telas "My schedule" e "Settings" (claras). O modo escuro fica em ThemeProvider.tsx.
  forest: '#456756', // botões principais (Done, Find sections, +), aba selecionada
  mint: '#82CEA8', // botão "Invite friends" sem ninguém selecionado
  page: '#FAF7F0', // fundo das telas Schedule/Settings e dos campos de texto

  white: '#FFFFFF',
} as const;

/** Cores dos cursos na agenda, na ordem em que são atribuídas (Figma: azul CS, dourado MATH, verde ENGL...). */
export const coursePalette = ['#385E69', '#715B2D', '#456756', '#83608D', '#3F7F86', '#7A7A3A', '#526F8A'] as const;

/** Mistura duas cores hex. amount = quanto de `a` entra (0–1). */
export function mixHex(a: string, b: string, amount: number): string {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const mix = (x: number, y: number) => Math.round(x * amount + y * (1 - amount)).toString(16).padStart(2, '0');
  return `#${mix(r1, r2)}${mix(g1, g2)}${mix(b1, b2)}`;
}

// Cores para caminhos de amigos, na ordem em que são atribuídas a amigos novos.
// As 3 primeiras são do Figma; as outras combinam com a paleta.
export const friendPalette = [colors.purple, colors.blue, colors.gold, '#A0614A', '#3F7F86', '#7A7A3A'] as const;

/**
 * Versão bem clarinha de uma cor (mistura com o fundo `surface`).
 * Ex.: tint(colors.purple) ≈ fundo da linha "Maya" selecionada no Figma.
 */
export function tint(hex: string, amount = 0.12): string {
  return mixHex(hex, colors.surface, amount);
}
