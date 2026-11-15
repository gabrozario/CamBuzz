// LÓGICA PURA: o nome curto de um lugar/evento para aparecer no mapa (com zoom).

/** Nomes maiores que isso sem apelido são cortados numa palavra inteira. */
const MAX_LABEL_CHARS = 20;

/** Nome curto para o mapa: o apelido (shortName), ou o nome cortado com "…". */
export function mapLabel(item: { name: string; shortName?: string }): string {
  if (item.shortName) return item.shortName;
  if (item.name.length <= MAX_LABEL_CHARS) return item.name;
  const cut = item.name.slice(0, MAX_LABEL_CHARS);
  const space = cut.lastIndexOf(' ');
  return `${cut.slice(0, space > 8 ? space : MAX_LABEL_CHARS).replace(/[\s:,&|@-]+$/, '')}…`;
}
