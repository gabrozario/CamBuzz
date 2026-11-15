import { DEMO_NOW } from '../../data';
import type { ClassSession, TimeOfDay } from '../types';

/** "14:30" -> 870 (minutos desde meia-noite). Facilita comparar horários. */
export function toMinutes(time: TimeOfDay): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** 870 -> "14:30" (o contrário de toMinutes; 1440+ volta a contar do 00:00). */
export function toTime(minutes: number): TimeOfDay {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** "14:30" -> "2:30 PM" ("24:00", fim do dia na agenda, -> "12:00 AM") */
export function formatTime(time: TimeOfDay): string {
  const [rawH, m] = time.split(':').map(Number);
  const h = rawH % 24;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** "14:30" -> "2:30" (sem AM/PM, para chips curtos no mapa) */
export function formatTimeShort(time: TimeOfDay): string {
  return formatTime(time).replace(/ (AM|PM)$/, '');
}

/** Horário "agora" em "HH:MM" — usa DEMO_NOW se estiver definido. */
export function nowTime(): TimeOfDay {
  if (DEMO_NOW) return DEMO_NOW;
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Ordena aulas por horário de início (sem alterar o array original). */
export function sortByStart(classes: ClassSession[]): ClassSession[] {
  return [...classes].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

/** True se dois intervalos de horário se sobrepõem (útil para o filtro de Eventos). */
export function overlaps(aStart: TimeOfDay, aEnd: TimeOfDay, bStart: TimeOfDay, bEnd: TimeOfDay): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

/** "08:25","09:15" -> "8:25–9:15 AM"; "11:00","12:15" -> "11:00 AM–12:15 PM" (igual ao Figma). */
export function formatTimeRange(start: TimeOfDay, end: TimeOfDay): string {
  const a = formatTime(start);
  const b = formatTime(end);
  return a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)}–${b}` : `${a}–${b}`;
}
