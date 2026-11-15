import type { ReactNode, Ref } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type EdgePadding, type MKPointOfInterestCategoryType, type Region } from 'react-native-maps';
import { useAppTheme } from '../../theme';

/**
 * iPhone (Apple Maps): quais nomes de lugares aparecem (somem no zoom out e aparecem no zoom in, como no Maps).
 * Mesma ideia do Android (theme/mapStyle.ts): mostra campus, prédios públicos e lugares de referência,
 * esconde comércio (restaurantes, lojas, bancos...) para não brigar com os nossos pinos.
 * Sem isto, `showsPointsOfInterests={false}` sumiria com TODOS os nomes no iPhone.
 */
const IOS_PLACE_LABELS: MKPointOfInterestCategoryType[] = [
  'university',
  'school',
  'library',
  'museum',
  'theater',
  'musicVenue',
  'conventionCenter',
  'stadium',
  'fitnessCenter',
  'park',
  'landmark',
  'nationalMonument',
  'hospital',
  'pharmacy',
  'police',
  'fireStation',
  'postOffice',
  'hotel',
];

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
  /** Chamado quando a pessoa termina de mover/dar zoom (usado para agrupar pinos colados). */
  onRegionChangeComplete?: (region: Region) => void;
}

/** O mapa base do campus, com o estilo bege do Figma (ou verde-escuro no modo escuro). Não sabe nada sobre filtros. */
export function CampusMap({ ref, initialRegion = GT_REGION, padding, children, onRegionChangeComplete }: Props) {
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
      onRegionChangeComplete={onRegionChangeComplete}
      mapPadding={padding}
      showsPointsOfInterests={false}
      // Só vale no iPhone (Apple Maps) e tem prioridade sobre a linha de cima lá.
      pointsOfInterestFilter={Platform.OS === 'ios' ? IOS_PLACE_LABELS : undefined}
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
