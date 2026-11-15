import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { ISODate } from '../types';
import { todayISO } from '../utils/dates';
import { nowTime, toMinutes } from '../utils/time';

export interface Clock {
  /** Data de hoje ("YYYY-MM-DD"), do relógio do celular (ou DEMO_TODAY). */
  today: ISODate;
  /** Minutos desde a meia-noite (ex.: 14:30 → 870), do relógio do celular (ou DEMO_NOW). */
  minutes: number;
}

const read = (): Clock => ({ today: todayISO(), minutes: toMinutes(nowTime()) });

/**
 * Relógio "ao vivo": lê a data/hora do celular e se atualiza sozinho
 * na virada de cada minuto e quando o app volta do segundo plano.
 * Use em qualquer tela que precise saber "agora" (ex.: linha vermelha da Week View).
 */
export function useClock(): Clock {
  const [clock, setClock] = useState(read);

  useEffect(() => {
    // Só troca o estado se algo mudou (evita redesenhar à toa).
    const tick = () =>
      setClock((prev) => {
        const next = read();
        return next.today === prev.today && next.minutes === prev.minutes ? prev : next;
      });

    let interval: ReturnType<typeof setInterval> | undefined;
    // Espera a próxima virada de minuto e depois atualiza a cada 60 s, sempre no "segundo zero".
    const firstTick = setTimeout(() => {
      tick();
      interval = setInterval(tick, 60_000);
    }, 60_000 - (Date.now() % 60_000));

    // Voltou do segundo plano (o celular pode ter ficado horas bloqueado): atualiza na hora.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });

    return () => {
      clearTimeout(firstTick);
      if (interval) clearInterval(interval);
      sub.remove();
    };
  }, []);

  return clock;
}
