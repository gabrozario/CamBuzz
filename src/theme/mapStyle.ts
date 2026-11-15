import type { MapStyleElement } from 'react-native-maps';
import { colors, darkColors, type Palette } from './colors';

// Estilo do Google Maps para imitar o mapa "ilustrado" bege/verde do Figma.
// Esconde pontos comerciais e transporte para deixar o mapa limpo.
export function makeMapStyle(colors: Palette, buildingStroke = '#CFC7B3'): MapStyleElement[] {
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
export const campusMapStyleDark = makeMapStyle(darkColors, '#3A4D44');
