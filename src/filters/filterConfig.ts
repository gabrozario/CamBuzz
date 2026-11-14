import { Building2, CalendarDays, Users, Utensils, type LucideIcon } from 'lucide-react-native';
import type { FilterKey } from '../types';

export interface FilterConfig {
  key: FilterKey;
  label: string; // texto da barra inferior (igual ao Figma)
  sheetTitle: string; // título da aba que sobe
  icon: LucideIcon;
  /**
   * Filtros que podem ficar ativos ao mesmo tempo que outros.
   * Eventos + Pessoas juntos = "que evento dá pra ir com um amigo".
   */
  combinable: boolean;
  /** 'planned' = ainda não implementado (Dining e Campus resources ficam para depois). */
  status: 'ready' | 'planned';
}

// Ordem = ordem dos botões na barra inferior (igual ao Figma).
export const FILTERS: FilterConfig[] = [
  { key: 'events', label: 'Events', sheetTitle: 'Events', icon: CalendarDays, combinable: true, status: 'ready' },
  { key: 'resources', label: 'Resources', sheetTitle: 'Resources', icon: Building2, combinable: false, status: 'ready' },
  { key: 'food', label: 'Food options', sheetTitle: 'Food Options', icon: Utensils, combinable: false, status: 'planned' },
  { key: 'people', label: 'People', sheetTitle: 'People', icon: Users, combinable: true, status: 'ready' },
];
