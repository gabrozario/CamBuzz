import type { ComponentType } from 'react';
import { Utensils } from 'lucide-react-native';
import { BeehiveIcon, FootballIcon, TechTowerIcon, type GTIconProps } from '../components/icons/GTIcons';
import type { FilterKey } from '../types';

export interface FilterConfig {
  key: FilterKey;
  label: string; // texto da barra inferior (igual ao Figma)
  sheetTitle: string; // título da aba que sobe
  /** Ícone da barra: lucide ou um dos ícones GT de components/icons/GTIcons.tsx. */
  icon: ComponentType<GTIconProps>;
  /** 'planned' = ainda não implementado (Dining e Campus resources ficam para depois). */
  status: 'ready' | 'planned';
}

// Ordem = ordem dos botões na barra inferior (igual ao Figma).
// Qualquer combinação de até 2 filtros pode ficar ligada (ver src/hooks/useActiveFilters.ts).
// A key 'people' continua no código; para o usuário o filtro se chama "Friends".
// Ícones com tema Georgia Tech: bola de futebol americano, Tech Tower e colmeia.
export const FILTERS: FilterConfig[] = [
  { key: 'events', label: 'Events', sheetTitle: 'Events', icon: FootballIcon, status: 'ready' },
  { key: 'resources', label: 'Resources', sheetTitle: 'Resources', icon: TechTowerIcon, status: 'ready' },
  { key: 'food', label: 'Food', sheetTitle: 'Food', icon: Utensils, status: 'ready' },
  { key: 'people', label: 'Friends', sheetTitle: 'Friends', icon: BeehiveIcon, status: 'ready' },
];
