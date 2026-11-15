// IDENTIDADE VISUAL DA GEORGIA TECH — as 6 cores oficiais ficam em `gt` (abaixo).
// Toda cor do app é uma dessas 6 ou uma mistura/tom delas (ex.: "navy 66% + branco"),
// para tudo combinar. Use SEMPRE estas constantes em vez de escrever cores "na mão".
//
// Lógica de uso:
//   Navy      → texto, ícones, botões principais, pinos de eventos, linha "Next leg"
//   Gold      → detalhes: bordas, separadores, fundos suaves (sempre em tons claros)
//   Dark Gold → texto de destaque secundário: horários, categorias, Dining halls, Libraries
//   Buzz      → VOCÊ: seu caminho, "My Route" ligado, Restaurants/Printers, realces
//   Diploma   → fundo das telas e do mapa ilustrado
//   White     → cards, abas, botões flutuantes
//
// MODO ESCURO: dentro de componentes, pegue as cores do tema atual:
//   const { colors } = useAppTheme();            // mesmas chaves, claras ou escuras
//   const styles = useThemedStyles(makeStyles);  // makeStyles = (colors: Palette) => StyleSheet.create({...})
// O `colors` importado direto daqui é sempre a paleta CLARA.

/** As 6 cores oficiais da GT. */
export const gt = {
  gold: '#B39051',
  white: '#FFFFFF',
  navy: '#051E39',
  buzz: '#EAAA00',
  darkGold: '#8F713D',
  diploma: '#F9F6E5',
} as const;

/** Tons derivados das cores oficiais (usados por vários tokens abaixo). */
export const gtTones = {
  /** navy 68% + branco: azul-acinzentado, para amigos e Vending/CRC. */
  slate: '#556678',
  /** navy 82% + branco: azul um pouco mais claro que o navy. */
  navyMid: '#32475D',
  /** buzz 62% + navy: ocre escuro (buzz legível como texto). */
  ochre: '#937516',
} as const;

export const colors = {
  // Texto / elementos escuros
  ink: gt.navy, // títulos, ícones, pinos numerados de eventos, "next leg"
  muted: '#5A6A7C', // navy 66% + branco — subtítulos, texto secundário, ícones inativos
  subtle: '#8B9598', // navy 45% + diploma — nomes de rua, notas de rodapé

  // Superfícies
  surface: gt.white, // cards, botões flutuantes, barra inferior, bottom sheet
  border: '#EAE0CE', // gold 28% + branco — borda da busca / cards
  divider: '#F4EEE5', // gold 15% + branco — separadores de lista
  handle: '#D9C8A8', // gold 50% + branco — "pegador" do bottom sheet
  activeTab: '#E8DDC0', // gold 25% + diploma — fundo do filtro selecionado na barra

  // Mapa (visual "ilustrado"; com MAP_LOOK = 'google' só o modo escuro usa estas)
  mapBackground: gt.diploma,
  mapRoad: gt.white,
  mapBuilding: '#E4D7B9', // gold 30% + diploma
  mapPark: '#E8E1CA', // dark gold 16% + diploma
  mapLabel: '#5A6A7C',
  mapWater: '#CDD2D7', // navy 20% + branco

  // Cores de destaque (cada uma tem um significado no design; os nomes antigos foram mantidos)
  green: gt.navy, // destaque "positivo"/ação: links, "cabe no seu caminho", Open, checks
  greenSoft: '#FCF3DB', // buzz 14% + branco — fundo de destaque suave (caixa "fits", pílula "Open")
  gold: gt.darkGold, // horários de eventos, categorias, Dining hall, Libraries (texto legível)
  purple: gtTones.slate, // amigo 1 (Maya)
  purpleSoft: '#EEF0F2', // slate 10% + branco
  blue: gtTones.slate, // Vending / Campus Rec
  blueSoft: '#DDE0E4', // slate 20% + branco

  /** VOCÊ: seu caminho do dia, pílula "My Route" ligada, sua linha na legenda. */
  me: gt.buzz,

  // Popup "Add Friends" / Settings
  greenTint: '#F0E9DC', // gold 20% + branco — caixa do link de convite, botão "Edit name & email"
  inputBorder: '#DDCDB1', // gold 45% + branco — borda do campo de email
  checkboxBorder: '#8F9AA6', // navy 45% + branco — checkbox desmarcado
  error: '#A4513F', // mensagens de erro / "Closed" (exceção funcional: terracota que combina com o dourado)

  // Telas "My schedule" e "Settings". O modo escuro fica em ThemeProvider.tsx.
  forest: gt.navy, // botões principais (Done, Find sections, +), aba selecionada
  mint: gt.buzz, // botão "Invite friends" sem ninguém selecionado, ação do aviso (Toast)
  page: gt.diploma, // fundo das telas Schedule/Settings e dos campos de texto

  /** Texto/ícone sobre fundo `ink` (número branco nos pinos). No escuro o ink é claro, então vira escuro. */
  onInk: gt.white,
  white: gt.white,

  /** "Você está aqui" (a parada "agora" do SEU caminho): navy forte com anel, por cima do seu caminho buzz. */
  myLocation: gt.navy,
  // Barra de filtros "voadora": vidro meio transparente cor de diploma, borda dourada.
  floatingBar: 'rgba(249, 246, 229, 0.86)',
  floatingBarBorder: 'rgba(179, 144, 81, 0.35)',
};

/** Formato de uma paleta (clara ou escura): as mesmas chaves de `colors`. */
export type Palette = { [K in keyof typeof colors]: string };

/** Paleta escura: fundo navy, texto diploma, destaques buzz e dourado. Mesmos nomes da clara. */
export const darkColors: Palette = {
  ink: gt.diploma,
  muted: '#B5BAB5', // diploma 72% + navy
  subtle: '#7F8A8F', // diploma 50% + navy

  surface: '#1E344D', // navy 90% + branco
  border: '#35485F', // branco 10% + surface
  divider: '#293E56', // branco 6% + surface
  handle: '#62717F', // branco 30% + surface
  activeTab: '#48504E', // gold 28% + surface

  mapBackground: gt.navy,
  mapRoad: '#2A4058',
  mapBuilding: '#18304A',
  mapPark: '#1A3044',
  mapLabel: '#9AA3AB',
  mapWater: '#03152A',

  green: gt.buzz,
  greenSoft: '#3A3F37', // buzz 14% + surface
  gold: '#C2A674', // gold 80% + branco (legível no navy)
  purple: '#8D9AA8',
  purpleSoft: '#2C4157',
  blue: '#8D9AA8',
  blueSoft: '#2C4157',

  me: gt.buzz,

  greenTint: '#34465A',
  inputBorder: '#40536A',
  checkboxBorder: '#7F8A8F',
  error: '#E0907C',

  forest: gt.buzz,
  mint: gt.darkGold,
  page: gt.navy,

  onInk: gt.navy,
  white: gt.white,

  myLocation: gt.diploma,
  floatingBar: 'rgba(30, 52, 77, 0.86)',
  floatingBarBorder: 'rgba(179, 144, 81, 0.30)',
};

/** Cores dos cursos na agenda, na ordem em que são atribuídas (tons das cores da GT). */
export const coursePalette = [gt.navy, gt.darkGold, gtTones.slate, '#7A6230', gtTones.navyMid, gt.gold] as const;

/** Mistura duas cores hex. amount = quanto de `a` entra (0–1). */
export function mixHex(a: string, b: string, amount: number): string {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const mix = (x: number, y: number) => Math.round(x * amount + y * (1 - amount)).toString(16).padStart(2, '0');
  return `#${mix(r1, r2)}${mix(g1, g2)}${mix(b1, b2)}`;
}

/** Luminância relativa (WCAG) de uma cor hex. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Cor de texto/ícone legível sobre um fundo colorido: branco ou navy (o que tiver mais contraste).
 * Ex.: buzz e gold → navy; navy e dark gold → branco. Use em pinos, checkboxes e botões coloridos.
 */
export function readableOn(bg: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(bg)) return gt.white;
  const l = luminance(bg);
  return contrast(bg, gt.navy) > contrast(bg, gt.white) ? gt.navy : gt.white;
}

/** Contraste WCAG entre duas cores hex (1 a 21). */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/**
 * Versão de uma cor de dado (amigo, você) que dá para LER como texto sobre `bg`.
 * Cores claras como buzz e gold escurecem um pouco em direção ao navy (ou clareiam no fundo escuro)
 * até ficarem legíveis; cores já legíveis voltam iguais. Em componentes: `useAppTheme().legible(cor)`.
 */
export function legibleOn(hex: string, bg: string, min = 4.5): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex) || !/^#[0-9a-f]{6}$/i.test(bg)) return hex;
  const target = luminance(bg) > 0.4 ? gt.navy : gt.white;
  for (let keep = 1; keep >= 0; keep -= 0.05) {
    const candidate = mixHex(hex, target, keep);
    if (contrast(candidate, bg) >= min) return candidate;
  }
  return target;
}

// Cores para caminhos de amigos, na ordem em que são atribuídas a amigos novos.
// Todas diferentes do buzz (que é VOCÊ) e do navy grosso ("Next leg").
export const friendPalette = [gtTones.slate, gt.gold, gt.darkGold, gtTones.navyMid, gtTones.ochre, '#7A6230'] as const;

/**
 * Versão bem clarinha de uma cor (mistura com o fundo `surface` CLARO).
 * Ex.: tint(colors.purple) ≈ fundo da linha "Maya" selecionada.
 * Em componentes, prefira `useAppTheme().tint` (funciona também no modo escuro).
 */
export function tint(hex: string, amount = 0.12, base: string = colors.surface): string {
  return mixHex(hex, base, amount);
}
