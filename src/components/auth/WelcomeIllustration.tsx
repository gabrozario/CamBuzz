import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { fonts, useAppTheme } from '../../theme';

/**
 * "Mapa ilustrado" decorativo da tela de boas-vindas, no mesmo estilo do mapa do app:
 * ruas creme, prédios bege, gramados verdes, o caminho do dia (verde fino + "next leg" grosso),
 * o caminho de um amigo (roxo) e alguns pinos (evento, comida, recurso).
 * Desenhado em SVG (react-native-svg), escala para qualquer largura de tela.
 */
export function WelcomeIllustration() {
  const { colors } = useAppTheme();
  return (
    <Svg width="100%" height="100%" viewBox="0 0 360 360" preserveAspectRatio="xMidYMid slice">
      <Rect x="0" y="0" width="360" height="360" fill={colors.mapBackground} />

      {/* Gramados */}
      <Rect x="-20" y="150" width="130" height="120" rx="28" fill={colors.mapPark} />
      <Rect x="150" y="200" width="120" height="90" rx="22" fill={colors.mapPark} />
      <Rect x="280" y="40" width="110" height="80" rx="24" fill={colors.mapPark} />
      {[
        [30, 190],
        [62, 228],
        [22, 246],
        [300, 70],
        [334, 92],
        [180, 230],
        [236, 258],
      ].map(([cx, cy]) => (
        <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="7" fill={colors.green} opacity={0.14} />
      ))}

      {/* Ruas (borda fina + miolo creme) */}
      <G fill="none" strokeLinecap="round" strokeLinejoin="round">
        {[
          'M -20 130 H 380',
          'M 130 -20 V 380',
          'M 130 300 H 380',
          'M 270 130 V 380',
          'M -20 60 Q 60 60 130 20',
        ].map((d) => (
          <G key={d}>
            <Path d={d} stroke={colors.border} strokeWidth="22" />
            <Path d={d} stroke={colors.mapRoad} strokeWidth="18" />
          </G>
        ))}
      </G>
      <SvgText x="150" y="124" fill={colors.subtle} fontSize="9" fontFamily={fonts.medium} letterSpacing="2">
        FERST DR NW
      </SvgText>

      {/* Prédios */}
      {[
        [20, 80, 80, 36],
        [160, 30, 90, 70],
        [160, 150, 70, 40],
        [290, 150, 60, 70],
        [20, 300, 90, 50],
        [160, 315, 80, 40],
        [290, 320, 60, 40],
      ].map(([x, y, w, h]) => (
        <Rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="10" fill={colors.mapBuilding} stroke={colors.border} />
      ))}

      {/* Caminho de um amigo (roxo, tracejado leve) */}
      <Path
        d="M 60 98 V 130 H 195 V 170"
        fill="none"
        stroke={colors.purple}
        strokeWidth="3"
        strokeDasharray="2 7"
        strokeLinecap="round"
        opacity={0.8}
      />

      {/* Seu caminho do dia: resto do dia (fino) + próximo trecho (grosso) */}
      <Path d="M 205 65 V 130 H 320 V 185" fill="none" stroke={colors.green} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M 320 185 V 300 H 200 V 335" fill="none" stroke={colors.ink} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />

      {/* Paradas do seu dia (1 = agora, com anel) */}
      <Circle cx="320" cy="185" r="20" fill={colors.green} opacity={0.18} />
      {[
        [205, 65, '1'],
        [320, 185, '2'],
        [200, 335, '3'],
      ].map(([cx, cy, n]) => (
        <G key={n as string}>
          <Circle cx={cx} cy={cy} r="12" fill={colors.surface} stroke={colors.green} strokeWidth="3" />
          <SvgText
            x={cx}
            y={(cy as number) + 4}
            fill={colors.green}
            fontSize="11"
            fontFamily={fonts.bold}
            textAnchor="middle"
          >
            {n}
          </SvgText>
        </G>
      ))}

      {/* Pinos: evento (ink), comida (dourado), recurso (azul) */}
      <Pin x={95} y={170} color={colors.ink} label="1" />
      <Pin x={240} y={235} color={colors.gold} label="D1" />
      <Pin x={60} y={325} color={colors.blue} label="V2" />
    </Svg>
  );
}

function Pin({ x, y, color, label }: { x: number; y: number; color: string; label: string }) {
  const { colors } = useAppTheme();
  // Pino escuro no modo claro (texto branco); no escuro o ink fica claro, então o texto escurece.
  const textColor = color === colors.ink ? colors.onInk : colors.white;
  return (
    <G>
      <Circle cx={x} cy={y} r="15" fill={color} stroke={colors.surface} strokeWidth="2.5" />
      <SvgText x={x} y={y + 4} fill={textColor} fontSize="11" fontFamily={fonts.bold} textAnchor="middle">
        {label}
      </SvgText>
    </G>
  );
}
