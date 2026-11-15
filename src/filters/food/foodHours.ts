import type { ISODate, TimeOfDay, Weekday, WeeklyHours } from '../../types';
import { addDays, WEEKDAYS, weekdayOf } from '../../utils/dates';
import { formatTime, toMinutes } from '../../utils/time';

// LÓGICA PURA dos horários dos restaurantes (sem React).
// Horários vêm de data/food.json (fonte: dining.gatech.edu, "Normal Hours").

const FULL: Record<Weekday, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export const weekdayName = (d: Weekday) => FULL[d];

/** [abre, fecha] em minutos; "fecha" passa de 1440 quando vai além da meia-noite. */
function toSpan([open, close]: [TimeOfDay, TimeOfDay]): [number, number] {
  const a = toMinutes(open);
  let b = toMinutes(close);
  if (b <= a) b += 1440;
  return [a, b];
}

/** "7:00 AM – 10:00 PM" / "11:00 AM – 1:00 AM" / "Closed" (vários intervalos separados por vírgula). */
export function formatDayHours(ranges: [TimeOfDay, TimeOfDay][]): string {
  if (!ranges.length) return 'Closed';
  return ranges.map(([a, b]) => `${formatTime(a)} – ${formatTime(b)}`).join(', ');
}

export interface OpenStatus {
  open: boolean;
  /** "Open now · until 10:00 PM" / "Closed · opens 7:00 AM" / "Closed · opens Tue 7:00 AM" */
  label: string;
}

/** Está aberto nesta data/hora? Considera o "depois da meia-noite" do dia anterior. */
export function openStatus(hours: WeeklyHours, date: ISODate, now: TimeOfDay): OpenStatus {
  const t = toMinutes(now);
  const today = hours[weekdayOf(date)];
  const yesterday = hours[weekdayOf(addDays(date, -1))];

  // Ainda aberto desde ontem (ex.: Sankranti até 1:00 AM)?
  for (const r of yesterday) {
    const [, b] = toSpan(r);
    if (b > 1440 && t < b - 1440) return { open: true, label: `Open now · until ${formatTime(r[1])}` };
  }
  for (const r of today) {
    const [a, b] = toSpan(r);
    if (t >= a && t < b) return { open: true, label: `Open now · until ${formatTime(r[1])}` };
  }
  // Fechado: próxima abertura hoje ou nos próximos dias.
  const later = today.find((r) => toSpan(r)[0] > t);
  if (later) return { open: false, label: `Closed · opens ${formatTime(later[0])}` };
  for (let i = 1; i <= 7; i++) {
    const d = weekdayOf(addDays(date, i));
    if (hours[d].length) {
      const when = i === 1 ? 'tomorrow' : d;
      return { open: false, label: `Closed · opens ${when} ${formatTime(hours[d][0][0])}` };
    }
  }
  return { open: false, label: 'Closed this week' };
}

/** Os outros 6 dias, começando por amanhã (para a lista pequena embaixo do horário de hoje). */
export function otherDays(date: ISODate): Weekday[] {
  const start = WEEKDAYS.indexOf(weekdayOf(date));
  return Array.from({ length: 6 }, (_, i) => WEEKDAYS[(start + 1 + i) % 7]);
}
