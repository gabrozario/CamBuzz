import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fonts, useAppTheme } from '../../theme';

interface Props {
  /** Texto dentro da cabeça do alfinete ("C3", "L1", número do evento, "12" de um grupo). */
  label: string;
  color: string;
  /** Cor do texto (padrão: branco; use colors.onInk quando o alfinete é `ink`). */
  textColor?: string;
  /** Selecionado: alfinete maior. */
  selected?: boolean;
  /** Tamanho base (grupos usam um pouco maior). */
  size?: 'normal' | 'large';
  /** Bolinhas coloridas no canto (ex.: amigos que podem ir ao evento). */
  dots?: { id: string; color: string }[];
  /** Apagado (ex.: evento fora do seu caminho). */
  dimmed?: boolean;
}

/** Proporção do desenho: 28 de largura × 36 de altura (a ponta fica embaixo, no centro). */
const VIEW_W = 28;
const VIEW_H = 36;
const HEAD = 27; // altura da "cabeça" redonda, onde vai o texto
const PATH = 'M14 35 C14 35 2.5 22.5 2.5 13.5 A11.5 11.5 0 1 1 25.5 13.5 C25.5 22.5 14 35 14 35 Z';

/** Largura/altura do alfinete em dp para cada tamanho. */
export function placePinSize(selected = false, size: 'normal' | 'large' = 'normal') {
  const scale = (size === 'large' ? 1.15 : 1) * (selected ? 1.3 : 1);
  return { width: Math.round(VIEW_W * scale), height: Math.round(VIEW_H * scale) };
}

/** Espaço extra dos lados (para as bolinhas dos amigos) — o mesmo dos dois lados, para a ponta ficar no centro. */
export const PLACE_PIN_SIDE_PAD = 8;

/**
 * Alfinete (formato gota) de um lugar no mapa. Use dentro de um <Marker anchor={{ x: 0.5, y: 1 }}>:
 * a PONTA fica exatamente no local. A "foto" do marcador tem o tamanho do alfinete
 * (área de toque pequena, sem invadir os vizinhos).
 */
export function PlacePin({ label, color, textColor, selected = false, size = 'normal', dots, dimmed }: Props) {
  const { colors, readableOn } = useAppTheme();
  const { width, height } = placePinSize(selected, size);
  const scale = width / VIEW_W;
  const fontSize = (label.length >= 3 ? 9 : 10.5) * scale;

  return (
    <View style={{ width: width + PLACE_PIN_SIDE_PAD * 2, height, alignItems: 'center', opacity: dimmed ? 0.75 : 1 }}>
      <Svg width={width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
        <Path d={PATH} fill={color} stroke={colors.surface} strokeWidth={2} />
      </Svg>
      <View style={[styles.labelBox, { width, height: HEAD * scale }]} pointerEvents="none">
        <Text style={[styles.label, { fontSize, color: textColor ?? readableOn(color) }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      {!!dots?.length && (
        <View style={[styles.dots, { left: PLACE_PIN_SIDE_PAD + width - 8 }]}>
          {dots.map((d) => (
            <View key={d.id} style={[styles.dot, { backgroundColor: d.color, borderColor: colors.surface }]} />
          ))}
        </View>
      )}
    </View>
  );
}

/** Altura reservada para o nome embaixo do alfinete (fixa, para saber onde fica a ponta). */
export const PLACE_LABEL_HEIGHT = 18;

/**
 * Onde fica a PONTA do alfinete no marcador (para o `anchor` do <Marker>):
 * com o nome embaixo, a ponta não é mais a base do marcador.
 */
export function placePinAnchor(selected = false, withLabel = false) {
  const { height } = placePinSize(selected);
  return { x: 0.5, y: withLabel ? height / (height + PLACE_LABEL_HEIGHT) : 1 };
}

/** Nome embaixo do alfinete, no estilo dos nomes do Google/Apple Maps (texto escuro com contorno claro). */
export function PlacePinLabel({ text }: { text: string }) {
  const { colors } = useAppTheme();
  return (
    <Text
      style={[styles.mapLabel, { color: colors.ink, textShadowColor: colors.surface }]}
      numberOfLines={1}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  mapLabel: {
    marginTop: 3, // espaço entre a ponta do alfinete e o nome
    height: PLACE_LABEL_HEIGHT,
    maxWidth: 140,
    paddingHorizontal: 4,
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: PLACE_LABEL_HEIGHT,
    textAlign: 'center',
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 0 },
  },
  labelBox: { position: 'absolute', top: 0, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.bold, textAlign: 'center' },
  dots: { position: 'absolute', top: -2, flexDirection: 'row' },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, marginLeft: -3 },
});
