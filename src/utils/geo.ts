import type { LatLng } from '../types';

// Velocidade média de caminhada (~4,8 km/h), usada para estimar tempos a pé.
export const WALK_METERS_PER_MIN = 80;

const METERS_PER_DEG_LAT = 111_320;

/**
 * Converte lat/lng para metros (x, y) num plano local. Para distâncias dentro
 * de um campus (< 2 km) essa aproximação é mais que suficiente.
 */
function toXY(p: LatLng, refLat: number) {
  const metersPerDegLng = METERS_PER_DEG_LAT * Math.cos((refLat * Math.PI) / 180);
  return { x: p.longitude * metersPerDegLng, y: p.latitude * METERS_PER_DEG_LAT };
}

/** Distância em metros entre dois pontos. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const pa = toXY(a, a.latitude);
  const pb = toXY(b, a.latitude);
  return Math.hypot(pa.x - pb.x, pa.y - pb.y);
}

/** Comprimento total de um caminho (soma dos segmentos), em metros. */
export function pathLengthMeters(path: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += distanceMeters(path[i - 1], path[i]);
  return total;
}

/** Minutos a pé para percorrer `meters`. */
export function walkMinutes(meters: number): number {
  return Math.ceil(meters / WALK_METERS_PER_MIN);
}

/**
 * Ponto do caminho mais próximo de `point` e a distância até ele.
 * Usado para saber se um evento fica "no caminho".
 */
export function nearestPointOnPath(point: LatLng, path: LatLng[]): { point: LatLng; distance: number } {
  if (path.length === 1) return { point: path[0], distance: distanceMeters(point, path[0]) };

  const refLat = point.latitude;
  const p = toXY(point, refLat);
  let best = { point: path[0], distance: Infinity };

  for (let i = 1; i < path.length; i++) {
    const a = toXY(path[i - 1], refLat);
    const b = toXY(path[i], refLat);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    // t = posição da projeção no segmento (0 = início, 1 = fim)
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
    const distance = Math.hypot(a.x + t * dx - p.x, a.y + t * dy - p.y);
    if (distance < best.distance) {
      const from = path[i - 1];
      const to = path[i];
      best = {
        distance,
        point: {
          latitude: from.latitude + t * (to.latitude - from.latitude),
          longitude: from.longitude + t * (to.longitude - from.longitude),
        },
      };
    }
  }
  return best;
}
