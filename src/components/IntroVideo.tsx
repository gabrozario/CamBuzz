import { useEventListener } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView, type VideoThumbnail } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';

// Tempos da abertura (em milissegundos).
const WHITE_BEFORE_MS = 200; // tela branca antes do vídeo
const HOLD_LAST_FRAME_MS = 1000; // fica parado no último quadro
const FADE_OUT_MS = 400; // some aos poucos, revelando o app

// Tamanho: fração da LARGURA da tela (o vídeo é 1920×1080, 16:9). 1 = borda a borda.
const VIDEO_WIDTH_RATIO = 0.7;
const VIDEO_ASPECT = 1920 / 1080;

const INTRO_VIDEO = require('../../assets/cambuzz_intro.mp4');

/**
 * Abertura do app: branco → vídeo → segura o último quadro → fade out.
 * Fica POR CIMA do app (App.tsx), então ao sumir já aparece a tela de login (ou o mapa).
 *
 * Por que trocamos o vídeo por uma FOTO do último quadro antes do fade:
 * no Android, fazer fade num vídeo tocando (TextureView) pisca preto por um instante.
 * Uma imagem comum faz o fade limpo.
 */
export function IntroVideo({ onDone }: { onDone: () => void }) {
  const { width } = useWindowDimensions();
  const boxWidth = width * VIDEO_WIDTH_RATIO;
  const box = { width: boxWidth, height: boxWidth / VIDEO_ASPECT };

  const opacity = useRef(new Animated.Value(1)).current;
  const ended = useRef(false);
  const fading = useRef(false);
  const holdOver = useRef(false);
  const [lastFrame, setLastFrame] = useState<VideoThumbnail | null>(null);
  /** true quando a foto do último quadro já está na tela → o vídeo pode sair. */
  const [frozen, setFrozen] = useState(false);
  const frozenRef = useRef(false);

  const player = useVideoPlayer(INTRO_VIDEO, (p) => {
    p.loop = false;
    p.muted = true;
  });

  const fadeOut = () => {
    if (fading.current) return;
    fading.current = true;
    Animated.timing(opacity, { toValue: 0, duration: FADE_OUT_MS, useNativeDriver: true }).start(() => onDone());
  };

  // Começa a tocar depois do branco inicial.
  useEffect(() => {
    const t = setTimeout(() => player.play(), WHITE_BEFORE_MS);
    return () => clearTimeout(t);
  }, [player]);

  /** A foto apareceu: tira o vídeo; se já deu o tempo de segurar, faz o fade. */
  const onFrameShown = () => {
    frozenRef.current = true;
    setFrozen(true);
    if (holdOver.current) fadeOut();
  };

  useEventListener(player, 'playToEnd', () => {
    if (ended.current) return;
    ended.current = true;
    // O player fica parado no último quadro; enquanto isso tiramos a "foto" dele.
    player
      .generateThumbnailsAsync(Math.max(0, player.duration - 0.05))
      .then(([thumb]) => (thumb ? setLastFrame(thumb) : fadeOut()))
      .catch(() => fadeOut()); // sem foto: faz o fade no vídeo mesmo
    setTimeout(() => {
      holdOver.current = true;
      if (frozenRef.current) fadeOut();
    }, HOLD_LAST_FRAME_MS);
    // Segurança: se a foto demorar demais, sai assim mesmo.
    setTimeout(fadeOut, HOLD_LAST_FRAME_MS + 1500);
  });

  // Se o vídeo falhar, não prende o usuário na tela branca.
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'error') fadeOut();
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.screen, { opacity }]}>
      <View style={box}>
        {!frozen && (
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            nativeControls={false}
            surfaceType="textureView"
          />
        )}
        {lastFrame && (
          <Image
            source={lastFrame}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            onDisplay={onFrameShown}
          />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Branco fixo (também no modo escuro), igual ao fundo da abertura.
  screen: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
});
