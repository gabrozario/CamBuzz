import { createContext, useContext } from 'react';

/**
 * Quanto da parte de baixo da tela fica coberto pela barra de filtros "voadora"
 * (altura da barra + distância até a borda + um respiro). A aba (FilterSheet) vai
 * até o fim da tela, POR TRÁS da barra; este valor serve para:
 * - as alturas "recolhida" e "35%" continuarem mostrando o mesmo tanto ACIMA da barra;
 * - a lista ter um espaço no fim, para o último item não ficar escondido atrás da barra.
 * O MapScreen mede a barra e fornece o valor com <BottomClearanceContext.Provider>.
 */
export const BottomClearanceContext = createContext(0);

export function useBottomClearance(): number {
  return useContext(BottomClearanceContext);
}
