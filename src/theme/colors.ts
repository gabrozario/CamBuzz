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

  white: '#FFFFFF',
} as const;

// Cores disponíveis para caminhos de amigos (na ordem em que são atribuídas).
export const friendPalette = [colors.purple, colors.blue, colors.gold] as const;
