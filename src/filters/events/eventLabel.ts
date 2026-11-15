import type { CampusEvent } from '../../types';

// LÓGICA PURA: o nome curto de um evento para aparecer no mapa (com zoom).

/** Nomes maiores que isso sem apelido são cortados numa palavra inteira. */
const MAX_LABEL_CHARS = 20;

/** Nome curto para o mapa: o apelido (shortName) do events.json, ou o nome cortado com "…". */
export function eventMapLabel(event: Pick<CampusEvent, 'name' | 'shortName'>): string {
  if (event.shortName) return event.shortName;
  if (event.name.length <= MAX_LABEL_CHARS) return event.name;
  const cut = event.name.slice(0, MAX_LABEL_CHARS);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 8 ? cut.lastIndexOf(' ') : MAX_LABEL_CHARS).replace(/[\s:,&-]+$/, '')}…`;
}
