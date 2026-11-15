import { Building2, CalendarDays, Users, Utensils, type LucideIcon } from 'lucide-react-native';
import type { FilterKey } from '../types';

export interface FilterConfig {
  key: FilterKey;
  label: string; // texto da barra inferior (igual ao Figma)
  sheetTitle: string; // título da aba que sobe
  icon: LucideIcon;
  /** 'planned' = ainda não implementado (Dining e Campus resources ficam para depois). */
  status: 'ready' | 'planned';
}

// Ordem = ordem dos botões na barra inferior (igual ao Figma).
// Qualquer combinação de até 2 filtros pode ficar ligada (ver src/hooks/useActiveFilters.ts).
// A key 'people' continua no código; para o usuário o filtro se chama "Friends".
export const FILTERS: FilterConfig[] = [
  { key: 'events', label: 'Events', sheetTitle: 'Events', icon: CalendarDays, status: 'ready' },
  { key: 'resources', label: 'Resources', sheetTitle: 'Resources', icon: Building2, status: 'ready' },
  { key: 'food', label: 'Food options', sheetTitle: 'Food Options', icon: Utensils, status: 'ready' },
  { key: 'people', label: 'Friends', sheetTitle: 'Friends', icon: Users, status: 'ready' },
];
