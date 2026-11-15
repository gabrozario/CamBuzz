import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

/**
 * Ícones "Georgia Tech" da barra de filtros, desenhados à mão no mesmo estilo
 * dos ícones do lucide (traço fino, grade 24×24, pontas arredondadas).
 * Ocupam a grade inteira (≈ 2 a 22), igual ao garfo e faca do Food, para terem o mesmo tamanho.
 * Aceitam as mesmas props usadas na barra: size, color, strokeWidth.
 */
export interface GTIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Quanto cada desenho é ampliado em relação ao `size` pedido. O garfo e faca do lucide
 * "parecem" maiores (traços longos de ponta a ponta), então esses ícones crescem um pouco
 * para ficarem do mesmo tamanho visual. A área ocupada na barra continua `size`
 * (margem negativa), e o traço é dividido pela escala para ficar com a mesma grossura.
 */
const ICON_SCALE = { football: 1.25, tower: 1.12, hive: 1.18 };

function svgBox({ size = 24 }: GTIconProps, scale: number) {
  const drawn = size * scale;
  return {
    width: drawn,
    height: drawn,
    viewBox: '0 0 24 24',
    style: { margin: -(drawn - size) / 2 },
  };
}

function stroke({ color = 'currentColor', strokeWidth = 2 }: GTIconProps, scale: number) {
  return {
    stroke: color,
    strokeWidth: strokeWidth / scale,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
}

// ---- Bola de futebol americano ----
// Contorno em forma de "lente" na diagonal (de baixo-esquerda até cima-direita).
const BALL = 'M3 21C1.5 12 12 1.5 21 3C22.5 12 12 22.5 3 21Z';
/** Ponto no eixo da bola, a `d` do centro (positivo = para cima/direita). */
const axis = (d: number) => [12 + d, 12 - d] as const;
/** Linha perpendicular ao eixo, passando por `d`, com meia-largura `h`. */
const across = (d: number, h: number) => {
  const [x, y] = axis(d);
  return `M${x - h} ${y - h}L${x + h} ${y + h}`;
};
// Duas faixas em cada ponta (compridas; o clipPath corta no contorno).
const BALL_STRIPES = [-6.8, -5.2, 5.2, 6.8].map((d) => across(d, 8)).join('');
// Costura + cordões.
const BALL_SEAM = `M${axis(-3.4).join(' ')}L${axis(3.4).join(' ')}`;
const BALL_LACES = [-2.4, -0.8, 0.8, 2.4].map((d) => across(d, 1.1)).join('');

/** Events: bola de futebol americano (faixas nas pontas + costura com cordões). */
export function FootballIcon(props: GTIconProps) {
  const s = stroke(props, ICON_SCALE.football);
  return (
    <Svg {...svgBox(props, ICON_SCALE.football)}>
      <Defs>
        <ClipPath id="gtBall">
          <Path d={BALL} />
        </ClipPath>
      </Defs>
      <Path d={BALL} {...s} />
      <G clipPath="url(#gtBall)">
        <Path d={BALL_STRIPES} {...s} />
      </G>
      <Path d={BALL_SEAM} {...s} />
      <Path d={BALL_LACES} {...s} />
    </Svg>
  );
}

// ---- Tech Tower (digitalizada do esboço do time) ----
// Em cima: o pináculo grande, uma torrinha de cada lado (afastadas do pináculo, para aparecerem soltas) e o telhado do meio.
const TOWER = 'M4.42 11.88L12 0.8L19.58 11.88M0.4 15.2L2.1 11.6L3.8 15.2M6.5 15.2L12 10L17.5 15.2M20.2 15.2L21.9 11.6L23.6 15.2';
// Embaixo: "TECH" desenhado a traço, com as serifas retas do esboço (não é fonte, para ficar igual ao desenho).
const TECH_LETTERS = [
  'M1.8 17.4V16.6H6V17.4M3.9 16.6V22.9M2.9 22.9H4.9', // T
  'M7.4 16.6H11.3V17.4M7.9 16.6V22.9H11.5V22.1M7.9 19.75H10.4M10.4 19.3V20.2M7.4 22.9H7.9', // E
  'M16.3 16.6V17.6M16.3 17.1C15.5 16.4 12.8 16.3 12.8 19.75C12.8 23.2 15.5 23.1 16.5 22.3M16.5 21.6V22.6', // C
  'M17.9 16.6H19.2M18.5 16.6V22.9M17.9 22.9H19.2M20.9 16.6H22.2M21.5 16.6V22.9M20.9 22.9H22.2M18.5 19.75H21.5', // H
].join('');

/** Resources: Tech Tower em cima e "TECH" com serifas embaixo (a partir do esboço do time). */
export function TechTowerIcon(props: GTIconProps) {
  const s = stroke(props, ICON_SCALE.tower);
  // Letras com traço um pouco mais fino, senão elas se juntam no tamanho da barra.
  const letters = { ...s, strokeWidth: s.strokeWidth * 0.8 };
  return (
    <Svg {...svgBox(props, ICON_SCALE.tower)}>
      {/* pontas retas (miter), como no esboço */}
      <Path d={TOWER} {...s} strokeLinejoin="miter" />
      <Path d={TECH_LETTERS} {...letters} />
    </Svg>
  );
}

// ---- Colmeia (pendurada num galho) ----
// Camadas de cima para baixo: [x, largura]. Cada uma tem 3,6 de altura, começando em y = 4.
const HIVE_BANDS: [number, number][] = [
  [9, 6],
  [6, 12],
  [4, 16],
  [5, 14],
  [8, 8],
];
const HIVE_TOP = 4;
const BAND_H = 3.6;
// A entrada redonda fica no meio da 3ª camada (cruzando as divisas, como no desenho de referência).
const DOOR = { cx: 12, cy: 13, r: 2.4 };
const circle = ({ cx, cy, r }: typeof DOOR) =>
  `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`;

// Três abelhas em volta da colmeia: duas à direita, uma embaixo à esquerda (como na referência).
const BEES = 'M19.4 5.4L20.4 6.4L21.4 5.4M20.8 8.4L21.8 9.4L22.8 8.4M2.4 19.4L3.4 20.4L4.4 19.4';

/** Friends: colmeia em camadas, pendurada num galho, com a entrada redonda. */
export function BeehiveIcon(props: GTIconProps) {
  const s = stroke(props, ICON_SCALE.hive);
  return (
    <Svg {...svgBox(props, ICON_SCALE.hive)}>
      <Defs>
        {/* tudo menos o círculo da entrada (as linhas das camadas não passam por dentro dela) */}
        <ClipPath id="gtHiveDoor">
          <Path d={`M0 0H24V24H0Z${circle(DOOR)}`} clipRule="evenodd" />
        </ClipPath>
      </Defs>
      {/* galho com um raminho + cabinho */}
      <Path d="M3 2.5H20M7 2.5L5.5 1M16 2.5L17.5 1M12 2.5V4" {...s} />
      <G clipPath="url(#gtHiveDoor)">
        {HIVE_BANDS.map(([x, w], i) => (
          <Rect key={i} x={x} y={HIVE_TOP + i * BAND_H} width={w} height={BAND_H} rx={BAND_H / 2} {...s} />
        ))}
      </G>
      <Path d={circle(DOOR)} {...s} />
      {/* abelhinhas voando (o "v" das asas, com traço mais fino) */}
      <Path d={BEES} {...s} strokeWidth={s.strokeWidth * 0.8} />
    </Svg>
  );
}
