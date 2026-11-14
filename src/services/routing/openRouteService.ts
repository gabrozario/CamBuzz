import type { LatLng } from '../../types';
import { distanceMeters, pathLengthMeters } from '../../utils/geo';
import type { DayRoute } from '../../utils/route';
import preloadedCampusCache from './campusRouteCache.json';

/**
 * OpenRouteService (ORS) API - Pedestrian routing by HeiGIT (Heidelberg Institute for Geoinformation Technology).
 * Provides realistic walking routes following sidewalks, crosswalks, and campus footpaths.
 */
export const OPENROUTESERVICE_API_KEY =
  process.env.EXPO_PUBLIC_ORS_API_KEY ||
  'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImRmOGU3NzJlYjMwZTQ2MTNiNjcyN2Q3MjY1YjFjY2I5IiwiaCI6Im11cm11cjY0In0=';

export const OPENROUTESERVICE_URL = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';

export interface RouteSegmentResult {
  path: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
}

/** Chave de par de edifícios (ex: "howey>skiles") para lookup rápido. */
function pairKey(fromId?: string, toId?: string): string | undefined {
  if (!fromId || !toId) return undefined;
  return `${fromId}>${toId}`;
}

/** Chave de coordenadas aproximadas (5 casas decimais ~1 m). */
function coordKey(from: LatLng, to: LatLng): string {
  return `${from.latitude.toFixed(5)},${from.longitude.toFixed(5)}>${to.latitude.toFixed(5)},${to.longitude.toFixed(5)}`;
}

// Inicia o cache em memória com os trechos conhecidos do campus para velocidade instantânea e resiliência offline.
const memoryCache = new Map<string, RouteSegmentResult>();

// Popula o cache em memória com os caminhos pré-carregados do campus.
for (const [key, coords] of Object.entries(preloadedCampusCache as Record<string, LatLng[]>)) {
  if (coords && coords.length > 0) {
    const dist = pathLengthMeters(coords);
    memoryCache.set(key, {
      path: coords,
      distanceMeters: dist,
      durationSeconds: Math.round(dist / 1.33),
    });
  }
}

/** Retorna o caminho realista do cache para dois prédios, se disponível. */
export function getCachedCampusPath(fromBuildingId: string, toBuildingId: string): LatLng[] | undefined {
  const cached = memoryCache.get(`${fromBuildingId}>${toBuildingId}`);
  return cached?.path;
}

/**
 * Consulta a API do OpenRouteService (ORS) para calcular a rota a pé entre várias paradas consecutivas.
 * Retorna os segmentos de caminho detalhados para cada trecho.
 */
export async function fetchORSPedestrianRoute(
  coordinates: LatLng[],
): Promise<{ segments: RouteSegmentResult[] } | null> {
  if (coordinates.length < 2) return null;

  try {
    const res = await fetch(OPENROUTESERVICE_URL, {
      method: 'POST',
      headers: {
        Authorization: OPENROUTESERVICE_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json, application/geo+json',
      },
      body: JSON.stringify({
        coordinates: coordinates.map((c) => [c.longitude, c.latitude]),
      }),
    });

    if (!res.ok) {
      console.warn(`[ORS] Request error ${res.status}: ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature || !feature.geometry?.coordinates) {
      return null;
    }

    const rawCoords: [number, number][] = feature.geometry.coordinates;
    const wayPoints: number[] = feature.properties?.way_points;
    const rawSegments = feature.properties?.segments ?? [];

    const segments: RouteSegmentResult[] = [];

    if (wayPoints && wayPoints.length >= 2) {
      for (let i = 0; i < wayPoints.length - 1; i++) {
        const startIdx = wayPoints[i];
        const endIdx = wayPoints[i + 1];
        let slice = rawCoords.slice(startIdx, endIdx + 1);
        if (slice.length < 2 && slice.length > 0) {
          slice = [slice[0], slice[0]];
        }
        const path: LatLng[] = slice.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
        const seg = rawSegments[i];
        const distance = typeof seg?.distance === 'number' ? seg.distance : pathLengthMeters(path);
        const duration = typeof seg?.duration === 'number' ? seg.duration : Math.round(distance / 1.33);

        segments.push({
          path,
          distanceMeters: Math.round(distance),
          durationSeconds: Math.round(duration),
        });
      }
    } else {
      const path: LatLng[] = rawCoords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
      const summary = feature.properties?.summary;
      const distance = summary?.distance ?? pathLengthMeters(path);
      const duration = summary?.duration ?? Math.round(distance / 1.33);

      segments.push({
        path,
        distanceMeters: Math.round(distance),
        durationSeconds: Math.round(duration),
      });
    }

    return { segments };
  } catch (err) {
    console.warn('[ORS] Network/parsing error:', err);
    return null;
  }
}

/**
 * Consulta a rota a pé para um único trecho entre dois pontos.
 * Usa cache em memória se disponível.
 */
export async function fetchORSLeg(
  from: LatLng,
  to: LatLng,
  buildingKey?: string,
): Promise<RouteSegmentResult> {
  const cKey = coordKey(from, to);

  if (buildingKey && memoryCache.has(buildingKey)) {
    return memoryCache.get(buildingKey)!;
  }
  if (memoryCache.has(cKey)) {
    return memoryCache.get(cKey)!;
  }

  // Se forem o mesmo ponto
  if (distanceMeters(from, to) < 5) {
    const result: RouteSegmentResult = {
      path: [from, to],
      distanceMeters: 0,
      durationSeconds: 0,
    };
    if (buildingKey) memoryCache.set(buildingKey, result);
    memoryCache.set(cKey, result);
    return result;
  }

  const response = await fetchORSPedestrianRoute([from, to]);
  if (response && response.segments[0]) {
    const result = response.segments[0];
    if (buildingKey) memoryCache.set(buildingKey, result);
    memoryCache.set(cKey, result);
    return result;
  }

  // Fallback se a API falhar
  const dist = distanceMeters(from, to);
  const fallback: RouteSegmentResult = {
    path: [from, to],
    distanceMeters: Math.round(dist),
    durationSeconds: Math.round(dist / 1.33),
  };
  return fallback;
}

/**
 * Enriquece um DayRoute com caminhos realistas de pedestres calculados pelo OpenRouteService.
 * Tenta buscar todas as paradas em batch (1 única chamada de rede para o dia inteiro).
 * Se falhar, busca ou usa o cache trecho a trecho.
 */
export async function enhanceDayRouteWithORS(dayRoute: DayRoute): Promise<DayRoute> {
  if (dayRoute.legs.length === 0) return dayRoute;

  // Se todos os trechos já tiverem caminhos de múltiplos pontos (> 3 pontos), não precisa re-buscar
  const allAlreadyDetailed = dayRoute.legs.every((l) => l.path.length > 5);
  if (allAlreadyDetailed) {
    return dayRoute;
  }

  const stopCoordinates = dayRoute.stops.map((s) => s.building.coordinate);

  // Tentativa 1: Consulta em batch para todo o trajeto do dia
  const batchResult = await fetchORSPedestrianRoute(stopCoordinates);
  if (batchResult && batchResult.segments.length === dayRoute.legs.length) {
    const newLegs = dayRoute.legs.map((leg, index) => {
      const seg = batchResult.segments[index];
      const pKey = pairKey(leg.from.building.id, leg.to.building.id);
      if (pKey) memoryCache.set(pKey, seg);
      memoryCache.set(coordKey(leg.from.building.coordinate, leg.to.building.coordinate), seg);

      return {
        ...leg,
        path: seg.path,
        distanceMeters: seg.distanceMeters,
        durationSeconds: seg.durationSeconds,
      };
    });

    return {
      ...dayRoute,
      legs: newLegs,
    };
  }

  // Tentativa 2: Trecho a trecho (usando cache local se disponível)
  const newLegs = await Promise.all(
    dayRoute.legs.map(async (leg) => {
      const pKey = pairKey(leg.from.building.id, leg.to.building.id);
      const seg = await fetchORSLeg(leg.from.building.coordinate, leg.to.building.coordinate, pKey);

      return {
        ...leg,
        path: seg.path.length >= 2 ? seg.path : leg.path,
        distanceMeters: seg.distanceMeters,
        durationSeconds: seg.durationSeconds,
      };
    }),
  );

  return {
    ...dayRoute,
    legs: newLegs,
  };
}
