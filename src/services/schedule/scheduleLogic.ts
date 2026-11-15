import type {
  ClassSession,
  LatLng,
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
import { gtTones } from '../../theme/colors';
import { addDays, dayOfMonth, formatDate, weekdayOf } from '../../utils/dates';
import { formatTime, formatTimeRange, overlaps, toMinutes } from '../../utils/time';

// LÓGICA PURA da agenda (sem React): o que acontece em cada dia, conflitos e disponibilidade de amigos.

/** Cor dos eventos pessoais na agenda (cursos usam coursePalette). */
export const EVENT_COLOR = gtTones.ochre; // ocre (buzz escurecido): diferente dos cursos

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
export function occursOn(event: Pick<EventDraft, 'date' | 'repeat'> & { skipDates?: ISODate[] }, iso: ISODate): boolean {
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

/** O pedaço de um evento que cai num dia da agenda. */
export interface EventPortion {
  start: TimeOfDay;
  /** "24:00" = vai até a meia-noite (o evento continua no dia seguinte). */
  end: TimeOfDay;
  /** Dia em que esta ocorrência do evento começou (o dia anterior, se `continued`). */
  startedOn: ISODate;
  /** true = é a continuação, depois da meia-noite, de um evento que começou ontem. */
  continued: boolean;
}

/**
 * Pedaços do evento nesta data. Evento normal → no máximo 1.
 * Evento que vira a noite (23:30 → 02:30) → "23:30–24:00" no dia em que começa
 * e "00:00–02:30" no dia seguinte.
 */
export function eventPortionsOn(
  event: Pick<EventDraft, 'date' | 'start' | 'end' | 'endsNextDay' | 'repeat'> & { skipDates?: ISODate[] },
  iso: ISODate,
): EventPortion[] {
  const portions: EventPortion[] = [];
  const yesterday = addDays(iso, -1);
  if (event.endsNextDay && toMinutes(event.end) > 0 && occursOn(event, yesterday)) {
    portions.push({ start: '00:00', end: event.end, startedOn: yesterday, continued: true });
  }
  if (occursOn(event, iso)) {
    portions.push({ start: event.start, end: event.endsNextDay ? '24:00' : event.end, startedOn: iso, continued: false });
  }
  return portions;
}

/** "11:30 PM – 2:30 AM (next day)" / "6:00 PM – 7:00 PM" */
export function formatEventTime(event: Pick<EventDraft, 'start' | 'end' | 'endsNextDay'>): string {
  return `${formatTime(event.start)} – ${formatTime(event.end)}${event.endsNextDay ? ' (next day)' : ''}`;
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
  /** Início/fim DENTRO deste dia ("24:00" se o evento passa da meia-noite). */
  start: TimeOfDay;
  end: TimeOfDay;
  /** Dia em que esta ocorrência começou (≠ date na continuação de um evento que virou a noite). */
  startedOn: ISODate;
  /** Quando esta ocorrência termina DE VERDADE (para saber se já passou). */
  endsOn: ISODate;
  endsAt: TimeOfDay;
  color: string;
  buildingId?: string;
  /** Posição exata de um evento sem prédio (ao ar livre). */
  coordinate?: LatLng;
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
        startedOn: iso,
        endsOn: iso,
        endsAt: m.end,
        color: course.color,
        buildingId: m.buildingId,
        room: m.room,
      }),
    );
  }
  for (const event of schedule.events) {
    for (const p of eventPortionsOn(event, iso)) {
      blocks.push({
        key: `${event.id}-${p.startedOn}${p.continued ? '-cont' : ''}`,
        type: 'event',
        sourceId: event.id,
        date: iso,
        label: event.name,
        detail: event.location,
        start: p.start,
        end: p.end,
        startedOn: p.startedOn,
        endsOn: event.endsNextDay ? addDays(p.startedOn, 1) : p.startedOn,
        endsAt: event.end,
        color: EVENT_COLOR,
        buildingId: event.buildingId,
        coordinate: event.coordinate,
      });
    }
  }
  return blocks.sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

/** Paradas do dia para o MAPA: aulas + eventos com prédio conhecido OU com posição (ao ar livre). */
export function classesOnDate(schedule: MySchedule, iso: ISODate): ClassSession[] {
  return blocksOnDate(schedule, iso)
    .filter((b) => b.buildingId || b.coordinate)
    .map((b) => {
      const course = b.type === 'course' ? schedule.courses.find((c) => c.id === b.sourceId) : undefined;
      return {
        id: b.key,
        course: b.label,
        title: course?.title ?? b.label,
        kind: b.type === 'course' ? (b.detail as ClassSession['kind']) : 'Event',
        buildingId: b.buildingId ?? `place:${b.key}`,
        room: b.room,
        start: b.start,
        end: b.end,
        // Sem prédio: o caminho usa a posição exata, com o local/nome do evento como "prédio".
        place:
          !b.buildingId && b.coordinate
            ? { name: b.detail || b.label, shortName: shortPlaceName(b.detail || b.label), coordinate: b.coordinate }
            : undefined,
      };
    });
}

/** "Tech Green · near the fountain" → "Tech Green" (nome curto para o chip no mapa). */
function shortPlaceName(text: string): string {
  return text.split('·')[0].trim().slice(0, 24);
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
  /**
   * Dias em que as ocorrências em conflito COMEÇAM (é isso que o "Replace" pula).
   * Igual a `dates`, menos para um evento que vira a noite e bate só na parte depois da meia-noite.
   */
  startDates: ISODate[];
  start: TimeOfDay;
  end: TimeOfDay;
}

function candidateIntervals(schedule: MySchedule, candidate: Candidate, iso: ISODate) {
  if (candidate.type === 'event') return eventPortionsOn(candidate.draft, iso);
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
  // Evento único que vira a noite ocupa 2 dias.
  const days = repeats ? CONFLICT_HORIZON_DAYS : candidate.draft.endsNextDay ? 2 : 1;
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
      if (existing) {
        existing.dates.push(iso);
        if (!existing.startDates.includes(block.startedOn)) existing.startDates.push(block.startedOn);
      } else
        byKey.set(key, {
          type: block.type,
          sourceId: block.sourceId,
          label: block.label,
          dates: [iso],
          startDates: [block.startedOn],
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
          x.id === c.sourceId ? { ...x, skipDates: [...(x.skipDates ?? []), ...c.startDates] } : x,
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
    .filter((e) => e.buildingId)
    .flatMap((e) =>
      eventPortionsOn(e, iso).map((p) => ({
        id: `${friend.id}-${e.id}${p.continued ? '-cont' : ''}`,
        course: e.name,
        title: e.name,
        kind: 'Event' as const,
        buildingId: e.buildingId!,
        start: p.start,
        end: p.end,
      })),
    );
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
  when: Pick<EventDraft, 'date' | 'start' | 'end' | 'endsNextDay'>,
): Availability {
  const once = { ...when, repeat: 'none' as const };
  // O evento pode cair em 2 dias (se vira a noite): confere cada pedaço com o que o amigo tem naquele dia.
  const days = when.endsNextDay ? [when.date, addDays(when.date, 1)] : [when.date];
  const busy = days.flatMap((iso, dayIndex) => {
    const mine = eventPortionsOn(once, iso);
    const classes = isWeekend(iso) ? [] : friend.schedule;
    return [
      ...classes.map((s) => ({ label: s.kind === 'Study session' ? s.title : s.course, start: s.start, end: s.end })),
      ...acceptedEvents.flatMap((e) => eventPortionsOn(e, iso).map((p) => ({ label: e.name, start: p.start, end: p.end }))),
    ]
      .filter((b) => mine.some((m) => overlaps(b.start, b.end, m.start, m.end)))
      .map((b) => ({ ...b, dayIndex }));
  });

  if (!busy.length) return { free: true, text: `Free · nothing from ${formatTime(when.start)} to ${formatTime(when.end)}` };
  const first = busy.sort((a, b) => a.dayIndex - b.dayIndex || toMinutes(a.start) - toMinutes(b.start))[0];
  return { free: false, text: `Busy · ${first.label} until ${formatTime(first.end)}` };
}
