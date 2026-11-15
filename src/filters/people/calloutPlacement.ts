import type { LatLng } from '../../types';
import type { Viewport } from '../../utils/cluster';

/**
 * LÓGICA pura: onde pôr cada card de prédio compartilhado ("Clough / You now · Maya 11:30")
 * para ele NÃO cobrir as bolinhas dos caminhos nem outro card.
 *
 * Tudo é feito em pixels da tela (no zoom atual): testa posições em volta do prédio, da mais perto
 * para a mais longe (embaixo, em cima, lados, diagonais...), e fica com a primeira livre.
 * Sem o tamanho do mapa ainda, usa a posição padrão (embaixo).
 */

export interface Circle {
  coordinate: LatLng;
  radius: number; // px
}

export interface CalloutBox {
  key: string;
  coordinate: LatLng; // prédio
  width: number; // px (estimado)
  height: number; // px
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Folga mínima (px) entre o card e as bolinhas/outros cards. */
const MARGIN = 4;
/** Distância (px) entre o prédio e a borda do card na posição mais perto. */
const BASE_GAP = 16;
/** Quanto cada "volta" se afasta a mais, se nenhuma posição da volta anterior estava livre. */
const RING_STEP = 14;
const RINGS = 4;

/** Largura aproximada do card (Roboto Slab 12 no título, Roboto 11 na linha, padding 10+10). */
export function estimateCalloutWidth(title: string, line: string): number {
  const text = Math.max(title.length * 7, line.length * 5.9);
  return Math.min(220, Math.ceil(text) + 20);
}

function rectHitsCircle(r: Rect, c: { x: number; y: number; radius: number }): boolean {
  const nx = Math.max(r.x, Math.min(c.x, r.x + r.w));
  const ny = Math.max(r.y, Math.min(c.y, r.y + r.h));
  return Math.hypot(c.x - nx, c.y - ny) < c.radius + MARGIN;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w + MARGIN && b.x < a.x + a.w + MARGIN && a.y < b.y + b.h + MARGIN && b.y < a.y + a.h + MARGIN;
}

/**
 * Devolve, para cada card, a coordenada do CENTRO dele (o marcador fica centralizado nela).
 */
export function placeCallouts(
  boxes: CalloutBox[],
  circles: Circle[],
  viewport: Viewport | null,
  width: number,
  height: number,
): Record<string, LatLng> {
  const result: Record<string, LatLng> = {};

  // Sem tamanho da tela: card logo abaixo do prédio, como antes.
  if (!viewport || !width || !height) {
    for (const b of boxes) result[b.key] = b.coordinate;
    return result;
  }

  const pxPerLng = width / viewport.longitudeDelta;
  const pxPerLat = height / viewport.latitudeDelta;
  const toScreen = (c: LatLng) => ({
    x: (c.longitude - viewport.longitude) * pxPerLng,
    y: (viewport.latitude - c.latitude) * pxPerLat,
  });
  const fromScreen = (p: { x: number; y: number }): LatLng => ({
    latitude: viewport.latitude - p.y / pxPerLat,
    longitude: viewport.longitude + p.x / pxPerLng,
  });

  const dots = circles.map((c) => ({ ...toScreen(c.coordinate), radius: c.radius }));
  const placed: Rect[] = [];

  for (const b of boxes) {
    const p = toScreen(b.coordinate);
    const { width: w, height: h } = b;
    let chosen: Rect | null = null;
    let fallback: Rect | null = null;

    for (let ring = 0; ring < RINGS && !chosen; ring++) {
      const g = BASE_GAP + ring * RING_STEP;
      // Centro do card em relação ao prédio, da posição preferida para as outras.
      const offsets = [
        { dx: 0, dy: g + h / 2 }, // embaixo
        { dx: 0, dy: -(g + h / 2) }, // em cima
        { dx: g + w / 2, dy: 0 }, // direita
        { dx: -(g + w / 2), dy: 0 }, // esquerda
        { dx: g + w / 2, dy: g + h / 2 }, // embaixo à direita
        { dx: -(g + w / 2), dy: g + h / 2 }, // embaixo à esquerda
        { dx: g + w / 2, dy: -(g + h / 2) }, // em cima à direita
        { dx: -(g + w / 2), dy: -(g + h / 2) }, // em cima à esquerda
      ];
      for (const o of offsets) {
        const r = { x: p.x + o.dx - w / 2, y: p.y + o.dy - h / 2, w, h };
        fallback ??= r;
        if (dots.some((d) => rectHitsCircle(r, d))) continue;
        if (placed.some((q) => rectsOverlap(r, q))) continue;
        chosen = r;
        break;
      }
    }

    const r = chosen ?? fallback!;
    placed.push(r);
    result[b.key] = fromScreen({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
  }
  return result;
}
