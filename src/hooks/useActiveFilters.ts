import { useCallback, useState } from 'react';
import type { FilterKey } from '../types';

/** No máximo 2 filtros ligados ao mesmo tempo (mais que isso polui o mapa). */
export const MAX_ACTIVE_FILTERS = 2;

interface State {
  /** Filtros ligados, na ordem em que foram ligados (camadas aparecem juntas no mapa). */
  active: FilterKey[];
  /** O filtro que você está vendo agora (a aba dele está aberta). */
  focus: FilterKey | null;
}

/**
 * Quais filtros estão ligados e qual está em foco. Regras (qualquer combinação):
 * - tocar num filtro desligado liga e coloca em foco; se já havia 2, sai o que NÃO está em foco;
 * - tocar no filtro em foco desliga (o outro, se houver, vem para a frente);
 * - tocar no filtro ligado de segundo plano só traz ele para a frente;
 * - `remove(key)` desliga direto (botão × na barra, X da aba, botão voltar do Android).
 */
export function useActiveFilters() {
  const [{ active, focus }, setState] = useState<State>({ active: [], focus: null });

  const press = useCallback((key: FilterKey) => {
    setState(({ active: current, focus: currentFocus }) => {
      if (current.includes(key)) {
        if (currentFocus !== key) return { active: current, focus: key };
        const rest = current.filter((k) => k !== key);
        return { active: rest, focus: rest[rest.length - 1] ?? null };
      }
      const kept = current.length >= MAX_ACTIVE_FILTERS ? current.filter((k) => k === currentFocus) : current;
      return { active: [...kept.slice(-(MAX_ACTIVE_FILTERS - 1)), key], focus: key };
    });
  }, []);

  const remove = useCallback((key: FilterKey) => {
    setState(({ active: current, focus: currentFocus }) => {
      const rest = current.filter((k) => k !== key);
      return { active: rest, focus: currentFocus === key ? (rest[rest.length - 1] ?? null) : currentFocus };
    });
  }, []);

  const clear = useCallback(() => setState({ active: [], focus: null }), []);

  return { active, focus, press, remove, clear };
}
