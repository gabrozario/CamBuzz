import { Polyline } from 'react-native-maps';
import { colors } from '../../theme';
import { shiftCoordinate, type DayRoute } from '../../utils/route';
import { StopMarker } from './StopMarker';

interface Props {
  route: DayRoute;
  color: string;
  /** Destacar o próximo trecho com linha grossa. */
  highlightNextLeg?: boolean;
  /** Cor da linha grossa do próximo trecho (padrão: ink, como no Figma). */
  nextLegColor?: string;
  showMarkers?: boolean;
  /** Mostrar o chip "9:00 · Howey" embaixo de cada marcador (desligue com várias pessoas). */
  showChips?: boolean;
  /** Deslocamento (em "passos" de ~11 m) para não sobrepor o caminho de outra pessoa. */
  offset?: number;
}

/**
 * Desenha o caminho de um dia (linhas + marcadores) dentro do <CampusMap>.
 * Usado para você e para cada amigo (cada um com sua cor).
 */
export function DayRouteLayer({
  route,
  color,
  highlightNextLeg = false,
  nextLegColor = colors.ink,
  showMarkers = true,
  showChips = true,
  offset = 0,
}: Props) {
  const shift = (path: typeof route.legs[number]['path']) => path.map((p) => shiftCoordinate(p, offset));

  return (
    <>
      {route.legs.map((leg) => (
        <Polyline
          key={`${leg.from.session.id}-${leg.to.session.id}`}
          coordinates={shift(leg.path)}
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
              coordinates={shift(leg.path)}
              strokeColor={nextLegColor}
              strokeWidth={8}
              lineCap="round"
              lineJoin="round"
              zIndex={2}
            />
          ))}
      {showMarkers &&
        route.stops.map((stop) => (
          <StopMarker key={stop.session.id} stop={stop} color={color} showChip={showChips} offset={offset} />
        ))}
    </>
  );
}
