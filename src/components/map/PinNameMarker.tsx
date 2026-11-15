import { Platform, StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { fonts, radius, shadow, useAppTheme } from '../../theme';
import type { LatLng } from '../../types';
import { PLACE_LABEL_HEIGHT, PlacePinLabel, placePinSize } from './PlacePin';
import { useTracksViewChanges } from './useTracksViewChanges';

interface Props {
  coordinate: LatLng;
  text: string;
  /**
   * 'label' = nome simples (aparece com zoom);
   * 'bubble' = balão com o nome do lugar ABERTO (selecionado) — no mesmo lugar do nome, embaixo do alfinete.
   */
  variant?: 'label' | 'bubble';
  /** O alfinete deste lugar está selecionado (maior) — o nome/balão fica abaixo da ponta dele. */
  selected?: boolean;
}

/** Espaço entre a ponta do alfinete e o balão. */
const GAP = 6;
/** Espaço entre a ponta do alfinete e o nome simples (marginTop do PlacePinLabel). */
const LABEL_GAP = 3;
/** Empurra o nome simples um passinho para a direita (metade deste valor), mantendo-o centrado no alfinete. */
const LABEL_NUDGE_RIGHT = 6;
/** Altura fixa do balão (padding 6 + linha 17 + padding 6). */
const BUBBLE_HEIGHT = 29;

/**
 * NOME de um lugar embaixo do alfinete, num marcador SEPARADO e não tocável:
 * - o nome simples que aparece com zoom;
 * - o balão com o nome do lugar aberto (selecionado), no MESMO lugar do nome.
 *
 * Por que separado: o alfinete clicável tem que ser SÓ o alfinete, sempre do mesmo tamanho — igual às
 * impressoras, que funcionam perfeitamente no iPhone. Quando o nome ficava dentro do marcador, o marcador
 * mudava de tamanho (e ficava largo) ao dar zoom; no iPhone a área de toque não acompanhava e cobria os
 * vizinhos, e só alguns alfinetes clicavam.
 *
 * Fica numa camada ABAIXO dos alfinetes e logo abaixo da ponta, sem cobrir a cabeça de nenhum.
 */
export function PinNameMarker({ coordinate, text, variant = 'label', selected = false }: Props) {
  const { colors } = useAppTheme();
  const tracks = useTracksViewChanges([text, variant, selected]);
  const contentHeight = variant === 'bubble' ? GAP + BUBBLE_HEIGHT : LABEL_GAP + PLACE_LABEL_HEIGHT;
  // Android: anchor no TOPO do nome = na ponta do alfinete.
  // iPhone (ignora anchor e centraliza o marcador no local; o alfinete também fica centralizado lá):
  // desce o nome metade do alfinete + metade do nome, para ele começar logo abaixo do alfinete.
  const pinHalf = placePinSize(selected).height / 2;
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0 }}
      centerOffset={{ x: 0, y: Platform.OS === 'ios' ? pinHalf + contentHeight / 2 : 0 }}
      tracksViewChanges={tracks}
      zIndex={variant === 'bubble' ? 29 : 10}
      tappable={false}
    >
      {variant === 'bubble' ? (
        <View style={styles.bubbleBox}>
          <View style={[styles.bubble, { backgroundColor: colors.surface }]}>
            <Text style={[styles.bubbleText, { color: colors.ink }]} numberOfLines={1}>
              {text}
            </Text>
          </View>
        </View>
      ) : (
        // paddingLeft: o nome anda um passinho para a direita (o marcador continua centrado no alfinete).
        <View style={{ paddingLeft: LABEL_NUDGE_RIGHT }}>
          <PlacePinLabel text={text} />
        </View>
      )}
    </Marker>
  );
}

const styles = StyleSheet.create({
  // paddingTop = o mesmo espaço do nome simples (o balão fica onde o nome ficava).
  bubbleBox: { paddingTop: GAP, paddingHorizontal: 6, alignItems: 'center' },
  bubble: {
    height: BUBBLE_HEIGHT,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: 240,
    justifyContent: 'center',
    ...shadow,
  },
  bubbleText: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 17 },
});
