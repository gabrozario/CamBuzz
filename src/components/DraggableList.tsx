import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

interface Props<T> {
  items: T[];
  keyOf: (item: T) => string;
  /** `dragging` = este item está sendo arrastado agora (para mudar o visual). */
  renderItem: (item: T, dragging: boolean) => ReactNode;
  /** Recebe as chaves na ORDEM NOVA quando você solta o item. */
  onReorder: (keys: string[]) => void;
}

/** Quanto tempo segurar antes de começar a arrastar (toque rápido continua sendo toque normal). */
const LONG_PRESS_MS = 300;

/**
 * Lista que dá para reordenar: SEGURE um item e ARRASTE para cima/baixo; os outros abrem espaço.
 * Toques rápidos e a rolagem da lista continuam funcionando normalmente.
 * Supõe itens com alturas parecidas (usa a maior altura medida).
 */
export function DraggableList<T>({ items, keyOf, renderItem, onReorder }: Props<T>) {
  const active = useSharedValue(-1); // índice do item sendo arrastado (-1 = nenhum)
  const dragY = useSharedValue(0); // quanto o dedo andou desde o início
  const rowHeight = useSharedValue(64);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const resetPending = useRef(false);

  const keys = items.map(keyOf);
  const keysSignature = keys.join('|');

  // Depois que a lista é redesenhada na ordem nova, zera o "arrasto" (sem pulo visual).
  useLayoutEffect(() => {
    if (!resetPending.current) return;
    resetPending.current = false;
    active.set(-1);
    dragY.set(0);
  }, [keysSignature, active, dragY]);

  const onStart = useCallback((key: string) => setDraggingKey(key), []);

  const onDrop = useCallback(
    (from: number, to: number) => {
      setDraggingKey(null);
      if (from === to) {
        active.set(-1);
        dragY.set(0);
        return;
      }
      const next = [...keys];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      resetPending.current = true;
      onReorder(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keysSignature, onReorder, active, dragY],
  );

  const measure = useCallback((h: number) => {
    if (h > rowHeight.get()) rowHeight.set(h);
  }, [rowHeight]);

  return (
    <View>
      {items.map((item, index) => {
        const key = keyOf(item);
        return (
          <DraggableRow
            key={key}
            itemKey={key}
            index={index}
            count={items.length}
            active={active}
            dragY={dragY}
            rowHeight={rowHeight}
            onStart={onStart}
            onDrop={onDrop}
            onMeasure={measure}
          >
            {renderItem(item, draggingKey === key)}
          </DraggableRow>
        );
      })}
    </View>
  );
}

interface RowProps {
  itemKey: string;
  index: number;
  count: number;
  active: SharedValue<number>;
  dragY: SharedValue<number>;
  rowHeight: SharedValue<number>;
  onStart: (key: string) => void;
  onDrop: (from: number, to: number) => void;
  onMeasure: (height: number) => void;
  children: ReactNode;
}

function DraggableRow({ itemKey, index, count, active, dragY, rowHeight, onStart, onDrop, onMeasure, children }: RowProps) {
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(LONG_PRESS_MS)
        .onStart(() => {
          active.set(index);
          dragY.set(0);
          runOnJS(onStart)(itemKey);
        })
        .onUpdate((e) => {
          dragY.set(e.translationY);
        })
        .onEnd(() => {
          const target = Math.min(count - 1, Math.max(0, index + Math.round(dragY.get() / rowHeight.get())));
          runOnJS(onDrop)(index, target);
        }),
    [index, count, itemKey, active, dragY, rowHeight, onStart, onDrop],
  );

  const style = useAnimatedStyle(() => {
    const a = active.get();
    if (a < 0) return { transform: [{ translateY: 0 }, { scale: 1 }], zIndex: 0 };
    if (a === index) return { transform: [{ translateY: dragY.get() }, { scale: 1.03 }], zIndex: 10 };
    // Os outros itens "abrem espaço" para onde o item arrastado vai cair.
    const h = rowHeight.get();
    const target = Math.min(count - 1, Math.max(0, a + Math.round(dragY.get() / h)));
    let shift = 0;
    if (a < index && index <= target) shift = -h;
    else if (target <= index && index < a) shift = h;
    return { transform: [{ translateY: withTiming(shift, { duration: 150 }) }, { scale: 1 }], zIndex: 0 };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={style} onLayout={(e) => onMeasure(e.nativeEvent.layout.height)}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
