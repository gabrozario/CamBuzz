import { BottomSheetScrollView, useBottomSheetInternal } from '@gorhom/bottom-sheet';
import type { ComponentProps } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useFloatingBar } from '../floatingBar';
import { useBottomClearance } from './bottomClearance';

/**
 * Espaço no fim da lista do tamanho da parte da aba que está ESCONDIDA abaixo da tela.
 *
 * Por quê: o @gorhom/bottom-sheet dá ao conteúdo sempre a altura da aba em tela
 * cheia. Com a aba em 35%, o fim da lista ficaria fora da tela e não daria para
 * rolar até ele. Esse espaço "empurra" o fim da lista para dentro da parte visível.
 * (Usa a API interna da biblioteca — se atualizar a versão, confira se ainda funciona.)
 */
function HiddenAreaSpacer() {
  const { animatedPosition, animatedDetentsState } = useBottomSheetInternal();
  const style = useAnimatedStyle(() => {
    const top = animatedDetentsState.get().highestDetentPosition ?? 0;
    return { height: Math.max(0, animatedPosition.get() - top) };
  });
  return <Animated.View style={style} />;
}

/**
 * Lista rolável para usar dentro do <FilterSheet>. Rola em qualquer altura da aba
 * (30%, tela cheia...) e sempre deixa chegar até o último item.
 */
export function SheetScrollView({ children, ...props }: ComponentProps<typeof BottomSheetScrollView>) {
  // A barra de filtros "voa" por cima do fim da aba: esse espaço deixa o último item parar acima dela.
  const clearance = useBottomClearance();
  // Rolar para baixo encolhe a barra; para cima, ela volta (ver components/floatingBar.ts).
  const { reportScroll } = useFloatingBar();
  return (
    <BottomSheetScrollView
      {...props}
      // (a biblioteca chama isto no JS a cada rolagem; um onScroll passado por quem usa é substituído)
      onScroll={(e) => reportScroll(e.nativeEvent.contentOffset.y)}
    >
      {children}
      <View style={{ height: clearance }} />
      <HiddenAreaSpacer />
    </BottomSheetScrollView>
  );
}
