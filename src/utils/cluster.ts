import type { LatLng } from '../types';

/** Parte do mapa visível agora (mesmo formato da `Region` do react-native-maps). */
export interface Viewport {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface Cluster<T> {
  key: string;
  /** Centro do grupo (média das coordenadas). */
  coordinate: LatLng;
  items: T[];
}

/**
 * Agrupa pinos que ficariam a menos de `radiusDp` uns dos outros NA TELA (no zoom atual).
 * Assim pinos colados (ex.: 12 restaurantes do Student Center) viram um só "3", "12"...
 * e dá para tocar neles. Ao dar zoom, os grupos se desfazem sozinhos.
 * Sem o tamanho do mapa ainda (width/height = 0), não agrupa nada.
 */
export function clusterOnScreen<T>(
  items: T[],
  coordOf: (item: T) => LatLng,
  keyOf: (item: T) => string,
  viewport: Viewport | null,
  width: number,
  height: number,
  radiusDp = 32,
): Cluster<T>[] {
  if (!viewport || !width || !height) {
    return items.map((item) => ({ key: keyOf(item), coordinate: coordOf(item), items: [item] }));
  }
  // Coordenada → posição na tela (em dp), aproximada (ok para a área pequena do campus).
  const toScreen = (c: LatLng) => ({
    x: ((c.longitude - viewport.longitude) / viewport.longitudeDelta) * width,
    y: ((viewport.latitude - c.latitude) / viewport.latitudeDelta) * height,
  });

  const groups: { anchor: { x: number; y: number }; items: T[] }[] = [];
  for (const item of items) {
    const p = toScreen(coordOf(item));
    const group = groups.find((g) => Math.hypot(g.anchor.x - p.x, g.anchor.y - p.y) < radiusDp);
    if (group) group.items.push(item);
    else groups.push({ anchor: p, items: [item] });
  }

  return groups.map((g) => {
    const coords = g.items.map(coordOf);
    return {
      key: g.items.map(keyOf).join('+'),
      coordinate: {
        latitude: coords.reduce((s, c) => s + c.latitude, 0) / coords.length,
        longitude: coords.reduce((s, c) => s + c.longitude, 0) / coords.length,
      },
      items: g.items,
    };
  });
}
