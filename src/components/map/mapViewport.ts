import { createContext, useContext } from 'react';
import type { LatLng } from '../../types';
import type { Viewport } from '../../utils/cluster';

/**
 * O que as camadas do mapa precisam saber sobre a tela (o MapScreen fornece):
 * - `viewport`/`width`/`height`: parte visível e tamanho do mapa → para agrupar pinos colados;
 * - `zoomTo(coords)`: aproxima a câmera nesses pontos (tocar num grupo "3" separa os pinos).
 */
export interface MapViewportValue {
  viewport: Viewport | null;
  width: number;
  height: number;
  zoomTo: (coords: LatLng[]) => void;
  /** Zoom perto o bastante para mostrar o NOME dos lugares (eventos, restaurantes, bibliotecas). */
  showPlaceLabels: boolean;
}

/**
 * Zoom (latitudeDelta) em que os nomes aparecem/somem. Dois valores (com uma folga entre eles)
 * para os nomes não ficarem piscando quando o zoom para bem no limite.
 * Número maior = nomes aparecem mais cedo ao dar zoom.
 */
export const LABELS_SHOW_DELTA = 0.0055;
export const LABELS_HIDE_DELTA = 0.0062;

/** Decide se os nomes devem aparecer, dado o zoom atual e se já estavam aparecendo. */
export function shouldShowPlaceLabels(latitudeDelta: number, showingNow: boolean): boolean {
  return showingNow ? latitudeDelta <= LABELS_HIDE_DELTA : latitudeDelta <= LABELS_SHOW_DELTA;
}

export const MapViewportContext = createContext<MapViewportValue>({
  viewport: null,
  width: 0,
  height: 0,
  zoomTo: () => {},
  showPlaceLabels: false,
});

export function useMapViewport(): MapViewportValue {
  return useContext(MapViewportContext);
}
