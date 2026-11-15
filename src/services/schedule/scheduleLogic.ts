import type {
  ClassSession,
  CourseMeeting,
  EnrolledCourse,
  EventDraft,
  Friend,
  ISODate,
  MySchedule,
  PersonalEvent,
  RepeatRule,
  TimeOfDay,
} from '../../types';
import { addDays, dayOfMonth, formatDate, weekdayOf } from '../../utils/dates';
import { formatTime, formatTimeRange, overlaps, toMinutes } from '../../utils/time';

// LÓGICA PURA da agenda (sem React): o que acontece em cada dia, conflitos e disponibilidade de amigos.

/** Cor dos eventos pessoais na agenda (cursos usam coursePalette). */
export const EVENT_COLOR = '#A0614A';

/** Até quantos dias à frente procuramos conflitos de coisas que se repetem. */
export const CONFLICT_HORIZON_DAYS = 120;

export const REPEAT_OPTIONS: { value: RepeatRule; label: string }[] = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Every weekday (Mon–Fri)' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
];

export function repeatLabel(rule: RepeatRule): string {
  return REPEAT_OPTIONS.find((o) => o.value === rule)?.label ?? rule;
}

const isWeekend = (iso: ISODate) => ['Sat', 'Sun'].includes(weekdayOf(iso));

/** O evento acontece nesta data? (respeita "Repeat" e dias pulados) */
export function occursOn(event: EventDraft & { skipDates?: ISODate[] }, iso: ISODate): boolean {
  if (iso < event.date || event.skipDates?.includes(iso)) return false;
  switch (event.repeat) {
    case 'none':
      return iso === event.date;
    case 'daily':
      return true;
    case 'weekdays':
      return !isWeekend(iso);
    case 'weekly':
      return weekdayOf(iso) === weekdayOf(event.date);
    case 'monthly':
      return dayOfMonth(iso) === dayOfMonth(event.date);
  }
}

/** Encontros do curso nesta data (vazio fora do semestre, em dias sem aula ou pulados). */
export function meetingsOn(schedule: MySchedule, course: EnrolledCourse, iso: ISODate): CourseMeeting[] {
  if (iso < schedule.termStart || iso > schedule.termEnd || course.skipDates?.includes(iso)) return [];
  const day = weekdayOf(iso);
  return course.meetings.filter((m) => m.days.includes(day));
}

/** Um bloco na agenda de um dia (curso ou evento), já com cor e textos. */
export interface ScheduleBlock {
  key: string;
  type: 'course' | 'event';
  sourceId: string; // EnrolledCourse.id ou PersonalEvent.id
  date: ISODate;
  label: string; // "CS 1332" ou o nome do evento
  detail: string; // "Lecture" / local do evento
  start: TimeOfDay;
  end: TimeOfDay;
  color: string;
  buildingId?: string;
  room?: string;
}

/** Tudo o que você tem num dia, em ordem de horário. */
export function blocksOnDate(schedule: MySchedule, iso: ISODate): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];
  for (const course of schedule.courses) {
    meetingsOn(schedule, course, iso).forEach((m, i) =>
      blocks.push({
        key: `${course.id}-${i}-${iso}`,
        type: 'course',
        sourceId: course.id,
        date: iso,
        label: course.code,
        detail: m.kind,
        start: m.start,
        end: m.end,
        color: course.color,
        buildingId: m.buildingId,
        room: m.room,
      }),
    );
  }
  for (const event of schedule.events) {
    if (!occursOn(event, iso)) continue;
    blocks.push({
      key: `${event.id}-${iso}`,
      type: 'event',
      sourceId: event.id,
      date: iso,
      label: event.name,
      detail: event.location,
      start: event.start,
      end: event.end,
      color: EVENT_COLOR,
      buildingId: event.buildingId,
    });
  }
  return blocks.sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

/** Paradas do dia para o MAPA: aulas + eventos que têm prédio conhecido. */
export function classesOnDate(schedule: MySchedule, iso: ISODate): ClassSession[] {
  return blocksOnDate(schedule, iso)
    .filter((b) => b.buildingId)
    .map((b) => {
      const course = b.type === 'course' ? schedule.courses.find((c) => c.id === b.sourceId) : undefined;
      return {
        id: b.key,
        course: b.label,
        title: course?.title ?? b.label,
        kind: b.type === 'course' ? (b.detail as ClassSession['kind']) : 'Event',
        buildingId: b.buildingId!,
        room: b.room,
        start: b.start,
        end: b.end,
      };
    });
}

// ---------------- Conflitos ----------------

/** Algo novo que você quer pôr na agenda. */
export type Candidate =
  | { type: 'event'; draft: EventDraft }
  | { type: 'course'; code: string; meetings: CourseMeeting[] };

/** Um item da sua agenda que bate de horário com o candidato. */
export interface Conflict {
  type: 'course' | 'event';
  sourceId: string;
  label: string;
  /** Datas em que bate (a primeira é a mais próxima). */
  dates: ISODate[];
  start: TimeOfDay;
  end: TimeOfDay;
}

function candidateIntervals(schedule: MySchedule, candidate: Candidate, iso: ISODate) {
  if (candidate.type === 'event') {
    return occursOn(candidate.draft, iso) ? [{ start: candidate.draft.start, end: candidate.draft.end }] : [];
  }
  if (iso < schedule.termStart || iso > schedule.termEnd) return [];
  return candidate.meetings.filter((m) => m.days.includes(weekdayOf(iso)));
}

/**
 * Procura conflitos do candidato com a sua agenda, dia a dia, a partir de `from`
 * (para coisas que se repetem: até CONFLICT_HORIZON_DAYS dias à frente).
 * Ao adicionar um curso que você já tem (outra section), ele mesmo não conta como conflito.
 */
export function findConflicts(schedule: MySchedule, candidate: Candidate, from: ISODate): Conflict[] {
  const start = candidate.type === 'event' ? candidate.draft.date : from;
  const repeats = candidate.type === 'course' || candidate.draft.repeat !== 'none';
  const days = repeats ? CONFLICT_HORIZON_DAYS : 1;
  const byKey = new Map<string, Conflict>();

  for (let i = 0; i < days; i++) {
    const iso = addDays(start, i);
    const mine = candidateIntervals(schedule, candidate, iso);
    if (!mine.length) continue;
    for (const block of blocksOnDate(schedule, iso)) {
      if (candidate.type === 'course' && block.type === 'course' && block.label === candidate.code) continue;
      if (!mine.some((m) => overlaps(m.start, m.end, block.start, block.end))) continue;
      const key = `${block.type}:${block.sourceId}:${block.start}`;
      const existing = byKey.get(key);
      if (existing) existing.dates.push(iso);
      else
        byKey.set(key, {
          type: block.type,
          sourceId: block.sourceId,
          label: block.label,
          dates: [iso],
          start: block.start,
          end: block.end,
        });
    }
  }
  return [...byKey.values()];
}

/** "CS 2110 · Mon, Nov 16 · 2:00–3:15 PM (+7 more days)" */
export function describeConflict(c: Conflict): string {
  const more = c.dates.length > 1 ? ` (+${c.dates.length - 1} more ${c.dates.length === 2 ? 'day' : 'days'})` : '';
  return `${c.label} · ${formatDate(c.dates[0])} · ${formatTimeRange(c.start, c.end)}${more}`;
}

/**
 * "Substituir": o novo item ganha.
 * - Curso novo x curso antigo → o curso antigo sai da agenda (você trocou de horário).
 * - Evento de uma vez só → sai da agenda.
 * - Nos outros casos → só os dias em conflito são pulados (skipDates).
 */
export function applyReplacement(schedule: MySchedule, conflicts: Conflict[], candidateType: Candidate['type']): MySchedule {
  let courses = [...schedule.courses];
  let events = [...schedule.events];
  for (const c of conflicts) {
    if (c.type === 'course') {
      if (candidateType === 'course') courses = courses.filter((x) => x.id !== c.sourceId);
      else
        courses = courses.map((x) =>
          x.id === c.sourceId ? { ...x, skipDates: [...(x.skipDates ?? []), ...c.dates] } : x,
        );
    } else {
      const ev = events.find((x) => x.id === c.sourceId);
      if (!ev) continue;
      if (ev.repeat === 'none') events = events.filter((x) => x.id !== c.sourceId);
      else
        events = events.map((x) =>
          x.id === c.sourceId ? { ...x, skipDates: [...(x.skipDates ?? []), ...c.dates] } : x,
        );
    }
  }
  return { ...schedule, courses, events };
}

// ---------------- Amigos ----------------

/**
 * O dia de um amigo: as aulas do friends.json (valem de segunda a sexta na demo)
 * + os eventos que ele aceitou (com prédio, para aparecer no mapa).
 */
export function friendSessionsOnDate(friend: Friend, acceptedEvents: PersonalEvent[], iso: ISODate): ClassSession[] {
  const classes = isWeekend(iso) ? [] : friend.schedule;
  const events: ClassSession[] = acceptedEvents
    .filter((e) => e.buildingId && occursOn(e, iso))
    .map((e) => ({
      id: `${friend.id}-${e.id}`,
      course: e.name,
      title: e.name,
      kind: 'Event',
      buildingId: e.buildingId!,
      start: e.start,
      end: e.end,
    }));
  return [...classes, ...events].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

export interface Availability {
  free: boolean;
  text: string; // "Free · nothing from 6:30 to 8:00 PM" / "Busy · CS 1332 until 1:20 PM"
}

/** O amigo está livre no horário do evento (na primeira data dele)? */
export function friendAvailability(
  friend: Friend,
  acceptedEvents: PersonalEvent[],
  when: Pick<EventDraft, 'date' | 'start' | 'end'>,
): Availability {
  const classes = isWeekend(when.date) ? [] : friend.schedule;
  const busy = [
    ...classes.map((s) => ({ label: s.kind === 'Study session' ? s.title : s.course, start: s.start, end: s.end })),
    ...acceptedEvents.filter((e) => occursOn(e, when.date)).map((e) => ({ label: e.name, start: e.start, end: e.end })),
  ].filter((b) => overlaps(b.start, b.end, when.start, when.end));

  if (!busy.length) return { free: true, text: `Free · nothing from ${formatTime(when.start)} to ${formatTime(when.end)}` };
  const first = busy.sort((a, b) => toMinutes(a.start) - toMinutes(b.start))[0];
  return { free: false, text: `Busy · ${first.label} until ${formatTime(first.end)}` };
}
