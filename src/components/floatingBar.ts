import { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * Barra de filtros "voadora" que encolhe ao rolar (como no Instagram):
 * - rolou a lista para BAIXO → a barra desce um pouco e diminui (foco na lista);
 * - rolou para CIMA (ou voltou ao topo) → a barra volta ao tamanho e posição normais.
 *
 * As listas avisam a rolagem por este contexto (SheetScrollView já faz isso sozinho).
 */
export interface FloatingBarControl {
  /** Chame com a posição de rolagem (contentOffset.y) da lista. */
  reportScroll: (y: number) => void;
  /** Volta a barra ao normal (ex.: trocou de filtro, fechou a aba). */
  expand: () => void;
}

export const FloatingBarContext = createContext<FloatingBarControl>({ reportScroll: () => {}, expand: () => {} });

export function useFloatingBar(): FloatingBarControl {
  return useContext(FloatingBarContext);
}

/** Quanto precisa rolar numa direção para a barra reagir (evita tremer com toques leves). */
const THRESHOLD = 8;
/** Tamanho da barra encolhida (0.8 = 80%). */
const SHRUNK_SCALE = 0.8;
const DURATION = 220;

/**
 * Cria o controle (use UMA vez, no MapScreen) e o estilo animado da barra.
 * `barHeight` e `barBottom` servem para calcular quanto ela desce ao encolher.
 */
export function useFloatingBarController(barHeight: number, barBottom: number) {
  const shrink = useSharedValue(0); // 0 = normal, 1 = encolhida
  const lastY = useRef(0);
  const shrunk = useRef(false);

  const setShrunk = useCallback(
    (value: boolean) => {
      if (shrunk.current === value) return;
      shrunk.current = value;
      shrink.set(withTiming(value ? 1 : 0, { duration: DURATION }));
    },
    [shrink],
  );

  const reportScroll = useCallback(
    (y: number) => {
      const dy = y - lastY.current;
      if (y <= 0) {
        lastY.current = 0;
        setShrunk(false);
        return;
      }
      if (Math.abs(dy) < THRESHOLD) return;
      lastY.current = y;
      setShrunk(dy > 0);
    },
    [setShrunk],
  );

  const expand = useCallback(() => {
    lastY.current = 0;
    setShrunk(false);
  }, [setShrunk]);

  // Encolhe a partir do centro e desce: metade do que "sobrou" da altura + parte da margem de baixo.
  const drop = (barHeight * (1 - SHRUNK_SCALE)) / 2 + barBottom * 0.55;
  const animatedStyle = useAnimatedStyle(() => {
    const t = shrink.get();
    return { transform: [{ translateY: t * drop }, { scale: 1 - t * (1 - SHRUNK_SCALE) }] };
  });

  const control = useMemo<FloatingBarControl>(() => ({ reportScroll, expand }), [reportScroll, expand]);
  return { control, animatedStyle };
}
