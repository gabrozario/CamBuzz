import { useCallback, useState } from 'react';
import { FILTERS } from '../filters/filterConfig';
import type { FilterKey } from '../types';

const isCombinable = (key: FilterKey) => FILTERS.find((f) => f.key === key)?.combinable ?? false;

/**
 * Quais filtros estão ativos. Regras:
 * - tocar num filtro ativo desliga ele;
 * - Events e People ("combinable") podem ficar ligados juntos;
 * - Campus resources / Food options ficam sozinhos (desligam os outros).
 */
export function useActiveFilters() {
  const [active, setActive] = useState<FilterKey[]>([]);

  const toggle = useCallback((key: FilterKey) => {
    setActive((current) => {
      if (current.includes(key)) return current.filter((k) => k !== key);
      if (!isCombinable(key)) return [key];
      return [...current.filter(isCombinable), key];
    });
  }, []);

  const clear = useCallback(() => setActive([]), []);

  return { active, toggle, clear };
}
