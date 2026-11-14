import { Polyline } from 'react-native-maps';
import { colors } from '../../theme';
import type { DayRoute } from '../../utils/route';
import { StopMarker } from './StopMarker';

interface Props {
  route: DayRoute;
  color: string;
  /** Destacar o próximo trecho com linha grossa escura (só para o usuário). */
  highlightNextLeg?: boolean;
  showMarkers?: boolean;
}

/**
 * Desenha o caminho de um dia (linhas + marcadores) dentro do <MapView>.
 * Reutilizável: o filtro de Amigos pode usar este mesmo componente com a cor do amigo.
 */
export function DayRouteLayer({ route, color, highlightNextLeg = false, showMarkers = true }: Props) {
  return (
    <>
      {route.legs.map((leg) => (
        <Polyline
          key={`${leg.from.session.id}-${leg.to.session.id}`}
          coordinates={leg.path}
          strokeColor={color}
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
          zIndex={1}
        />
      ))}
      {highlightNextLeg &&
        route.legs
          .filter((leg) => leg.isNext)
          .map((leg) => (
            <Polyline
              key={`next-${leg.to.session.id}`}
              coordinates={leg.path}
              strokeColor={colors.ink}
              strokeWidth={8}
              lineCap="round"
              lineJoin="round"
              zIndex={2}
            />
          ))}
      {showMarkers && route.stops.map((stop) => <StopMarker key={stop.session.id} stop={stop} color={color} />)}
    </>
  );
}
