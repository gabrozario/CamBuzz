import { DEMO_TODAY } from '../../data';
import type { ISODate, Weekday } from '../types';

// Datas são strings "YYYY-MM-DD" (sem fuso horário) para comparar e guardar com facilidade.

/** Na ordem da semana da agenda (segunda primeiro, como no Figma). */
export const WEEKDAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const FULL_NAMES: Record<Weekday, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};
const SHORT_LETTERS: Record<Weekday, string> = { Mon: 'M', Tue: 'Tue', Wed: 'W', Thu: 'Thu', Fri: 'F', Sat: 'Sat', Sun: 'Sun' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-11-16" -> Date (meio-dia local, para não "pular" de dia por causa do fuso). */
export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

/** Date -> "2026-11-16" */
export function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Data de hoje — usa DEMO_TODAY se estiver definido. */
export function todayISO(): ISODate {
  return DEMO_TODAY ?? toISODate(new Date());
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Dia da semana de uma data ("Mon", "Tue"...). */
export function weekdayOf(iso: ISODate): Weekday {
  return WEEKDAYS[(parseISODate(iso).getDay() + 6) % 7];
}

/** Segunda-feira da semana desta data. */
export function startOfWeek(iso: ISODate): ISODate {
  return addDays(iso, -WEEKDAYS.indexOf(weekdayOf(iso)));
}

/** "2026-11-16" -> "Mon, Nov 16" */
export function formatDate(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${weekdayOf(iso)}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "2026-11-16" -> "Nov 16" */
export function formatMonthDay(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** Dia do mês (16). */
export function dayOfMonth(iso: ISODate): number {
  return parseISODate(iso).getDate();
}

/** "Mondays, Wednesdays & Fridays" (cards da Block View). */
export function formatDaysLong(days: Weekday[]): string {
  const names = sortDays(days).map((d) => `${FULL_NAMES[d]}s`);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

/** "M, W, F" / "Tue, Thu" (opções de section, igual ao Figma). */
export function formatDaysShort(days: Weekday[]): string {
  return sortDays(days)
    .map((d) => SHORT_LETTERS[d])
    .join(', ');
}

export function sortDays(days: Weekday[]): Weekday[] {
  return [...days].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b));
}
