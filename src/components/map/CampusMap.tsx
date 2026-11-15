import type { ReactNode, Ref } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type EdgePadding, type LatLng, type Region } from 'react-native-maps';
import { useAppTheme } from '../../theme';

/**
 * Cantos do campus principal da Georgia Tech (aprox.): North Ave (sul) até a 10th St (norte),
 * Northside Dr/Hemphill (oeste) até a Tech Square (leste). É o que o mapa mostra ao abrir o app.
 * Todos os prédios/eventos/comidas de /data ficam dentro desse retângulo.
 */
export const GT_CAMPUS_BOUNDS: LatLng[] = [
  { latitude: 33.7705, longitude: -84.4065 }, // sudoeste
  { latitude: 33.782, longitude: -84.3895 }, // nordeste
];

/** O campus inteiro, como região do mapa (centro + tamanho). */
export const GT_REGION: Region = {
  latitude: (GT_CAMPUS_BOUNDS[0].latitude + GT_CAMPUS_BOUNDS[1].latitude) / 2,
  longitude: (GT_CAMPUS_BOUNDS[0].longitude + GT_CAMPUS_BOUNDS[1].longitude) / 2,
  latitudeDelta: GT_CAMPUS_BOUNDS[1].latitude - GT_CAMPUS_BOUNDS[0].latitude,
  longitudeDelta: GT_CAMPUS_BOUNDS[1].longitude - GT_CAMPUS_BOUNDS[0].longitude,
};

interface Props {
  /** Ref do MapView, para mover a câmera (fitToCoordinates, animateToRegion...). */
  ref?: Ref<MapView>;
  initialRegion?: Region;
  /** Chamado quando o mapa terminou de carregar (bom momento para enquadrar a câmera). */
  onMapReady?: () => void;
  /** Espaço ocupado por barras/cards sobre o mapa, para o enquadramento não ficar escondido. */
  padding?: EdgePadding;
  /** Camadas desenhadas no mapa (caminhos, marcadores de eventos, amigos...). */
  children?: ReactNode;
}

/** O mapa base do campus, com o estilo bege do Figma (ou verde-escuro no modo escuro). Não sabe nada sobre filtros. */
export function CampusMap({ ref, initialRegion = GT_REGION, onMapReady, padding, children }: Props) {
  const { mapStyle, colors, isDark } = useAppTheme();
  return (
    <MapView
      ref={ref}
      // Fundo enquanto o mapa carrega (evita um "flash" claro no modo escuro)
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.mapBackground }]}
      // Android: Google Maps (funciona no Expo Go sem chave) com o estilo bege/verde do Figma.
      // iPhone: Apple Maps — o Google Maps no iOS exige chave de API num app próprio (não roda no Expo Go).
      // O Apple Maps não aceita customMapStyle; lá só trocamos claro/escuro.
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      customMapStyle={mapStyle}
      userInterfaceStyle={isDark ? 'dark' : 'light'}
      initialRegion={initialRegion}
      onMapReady={onMapReady}
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
