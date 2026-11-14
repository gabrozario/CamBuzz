import type { ReactNode, Ref } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type EdgePadding, type Region } from 'react-native-maps';
import { campusMapStyle } from '../../theme';

/** Centro aproximado do campus da Georgia Tech (Tech Green). */
export const GT_REGION: Region = {
  latitude: 33.7756,
  longitude: -84.3963,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

interface Props {
  /** Ref do MapView, para mover a câmera (fitToCoordinates, animateToRegion...). */
  ref?: Ref<MapView>;
  initialRegion?: Region;
  /** Espaço ocupado por barras/cards sobre o mapa, para o enquadramento não ficar escondido. */
  padding?: EdgePadding;
  /** Camadas desenhadas no mapa (caminhos, marcadores de eventos, amigos...). */
  children?: ReactNode;
}

/** O mapa base do campus, com o estilo bege do Figma. Não sabe nada sobre filtros. */
export function CampusMap({ ref, initialRegion = GT_REGION, padding, children }: Props) {
  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_GOOGLE}
      customMapStyle={campusMapStyle}
      initialRegion={initialRegion}
      mapPadding={padding}
      showsPointsOfInterests={false}
      showsBuildings
      showsCompass={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
    >
      {children}
    </MapView>
  );
}
