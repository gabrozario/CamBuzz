import type { CampusEvent } from '../../types';
import { mapLabel } from '../../utils/mapLabel';

/** Nome curto de um evento para o mapa (apelido do events.json ou o nome cortado). */
export function eventMapLabel(event: Pick<CampusEvent, 'name' | 'shortName'>): string {
  return mapLabel(event);
}
