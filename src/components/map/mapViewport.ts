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
}

export const MapViewportContext = createContext<MapViewportValue>({
  viewport: null,
  width: 0,
  height: 0,
  zoomTo: () => {},
});

export function useMapViewport(): MapViewportValue {
  return useContext(MapViewportContext);
}
