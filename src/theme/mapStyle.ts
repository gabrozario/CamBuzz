import type { MapStyleElement } from 'react-native-maps';
import { colors, darkColors, type Palette } from './colors';

// Estilo do Google Maps para imitar o mapa "ilustrado" cor de diploma/dourado da GT.
// Esconde pontos comerciais e transporte para deixar o mapa limpo.
export function makeMapStyle(colors: Palette, buildingStroke = '#D9C8A8'): MapStyleElement[] {
  return [
  { elementType: 'geometry', stylers: [{ color: colors.mapBackground }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: colors.mapLabel }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: colors.surface }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: colors.mapPark }] },
  { featureType: 'poi.park', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: colors.mapBackground }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.fill', stylers: [{ color: colors.mapBuilding }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: buildingStroke }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: colors.mapRoad }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: colors.border }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: colors.subtle }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: colors.mapWater }] },
  ];
}

export const campusMapStyle = makeMapStyle(colors);
/** Mesmo mapa ilustrado, nas cores do modo escuro. */
export const campusMapStyleDark = makeMapStyle(darkColors, '#2A4058');

/**
 * Visual PADRÃO do Google Maps, só sem comércios, ícones de lugares e transporte
 * (para o caminho e os pinos do app aparecerem melhor). Usado quando MAP_LOOK = 'google'.
 */
export const googleCleanMapStyle: MapStyleElement[] = [
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];
