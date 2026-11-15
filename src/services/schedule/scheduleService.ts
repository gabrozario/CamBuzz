import { incomingInvites as initialIncoming, schedule as initialSchedule } from '../../../data';
import { coursePalette } from '../../theme/colors';
import type {
  CatalogCourse,
  EnrolledCourse,
  EventDraft,
  IncomingEventInvite,
  ISODate,
  MySchedule,
  PersonalEvent,
} from '../../types';
import { friendsService } from '../friends/friendsService';
import { applyReplacement, friendAvailability, type Conflict } from './scheduleLogic';

export type ServiceResult<T = null> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Tudo o que o app precisa do "backend" da agenda.
 * Hoje: implementação falsa em memória (mockScheduleService). Futuro: `apiScheduleService`
 * com fetch() e as MESMAS funções; troque em `scheduleService` lá embaixo. As telas não mudam.
 */
export interface ScheduleService {
  getSchedule(): Promise<MySchedule>;
  /** Eventos que cada amigo aceitou (por id do amigo) — entram no dia dele no mapa. */
  getFriendEvents(): Promise<Record<string, PersonalEvent[]>>;
  /** Convites de eventos que você recebeu e ainda não respondeu. */
  getIncomingInvites(): Promise<IncomingEventInvite[]>;

  /** Adiciona a section escolhida. Se você já tinha o curso, troca de section. `replace` = conflitos a substituir. */
  addCourse(course: CatalogCourse, sectionId: string, replace?: Conflict[]): Promise<ServiceResult<EnrolledCourse>>;
  removeCourse(courseId: string): Promise<ServiceResult>;
  /** Cria o evento e manda convite para os amigos escolhidos. */
  addEvent(draft: EventDraft, inviteFriendIds: string[], replace?: Conflict[]): Promise<ServiceResult<PersonalEvent>>;
  removeEvent(eventId: string): Promise<ServiceResult>;
  /** Pula um único dia de um curso ou evento que se repete. */
  skipDate(type: 'course' | 'event', id: string, date: ISODate): Promise<ServiceResult>;
  /** Aceitar (vai para a sua agenda) ou recusar um convite recebido. */
  respondToInvite(inviteId: string, accept: boolean, replace?: Conflict[]): Promise<ServiceResult<PersonalEvent | null>>;

  /** Avisa quando algo muda "do outro lado" (amigo respondeu, chegou convite). Retorna a função para parar. */
  subscribe(listener: () => void): () => void;
}

// ---------------- Implementação falsa (em memória) ----------------

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/** Demo: o convite da Maya (data/invites.json) "chega" alguns segundos depois de abrir o app. */
const INCOMING_DELAY_MS = 6000;
/** Demo: quanto tempo o amigo "demora" para aceitar o seu convite. */
const FRIEND_REPLY_MS = 3500;

let mySchedule: MySchedule = clone(initialSchedule);
let friendEvents: Record<string, PersonalEvent[]> = {};
let incoming: IncomingEventInvite[] = [];
let deliveredDemoInvites = false;
const listeners = new Set<() => void>();
let idCounter = 0;

const newId = (prefix: string) => `${prefix}-${Date.now()}-${idCounter++}`;
const notify = () => listeners.forEach((l) => l());

function nextCourseColor(): string {
  const used = new Set(mySchedule.courses.map((c) => c.color));
  return coursePalette.find((c) => !used.has(c)) ?? coursePalette[mySchedule.courses.length % coursePalette.length];
}

function replaceIfNeeded(replace: Conflict[] | undefined, type: 'course' | 'event') {
  if (replace?.length) mySchedule = applyReplacement(mySchedule, replace, type);
}

/** Simula cada amigo recebendo o popup e respondendo: quem está livre aceita; quem está ocupado ainda não respondeu. */
function simulateFriendReplies(event: PersonalEvent) {
  setTimeout(async () => {
    const friends = await friendsService.getFriends();
    let changed = false;
    const invites = event.invites.map((inv) => {
      const friend = friends.find((f) => f.id === inv.friendId);
      if (!friend || inv.status !== 'pending') return inv;
      if (!friendAvailability(friend, friendEvents[friend.id] ?? [], event).free) return inv;
      changed = true;
      friendEvents = { ...friendEvents, [friend.id]: [...(friendEvents[friend.id] ?? []), { ...event, invites: [] }] };
      return { ...inv, status: 'accepted' as const };
    });
    if (!changed) return;
    mySchedule = {
      ...mySchedule,
      events: mySchedule.events.map((e) => (e.id === event.id ? { ...e, invites } : e)),
    };
    notify();
  }, FRIEND_REPLY_MS);
}

export const mockScheduleService: ScheduleService = {
  async getSchedule() {
    return mySchedule;
  },
  async getFriendEvents() {
    return friendEvents;
  },
  async getIncomingInvites() {
    return incoming.filter((i) => i.status === 'pending');
  },

  async addCourse(course, sectionId, replace) {
    await wait(300);
    const section = course.sections.find((s) => s.id === sectionId);
    if (!section) return { ok: false, error: 'Section not found.' };
    replaceIfNeeded(replace, 'course');
    const previous = mySchedule.courses.find((c) => c.code === course.code);
    const enrolled: EnrolledCourse = {
      id: previous?.id ?? newId('c'),
      code: course.code,
      title: course.title,
      sectionId: section.id,
      instructor: section.instructor,
      meetings: section.meetings,
      color: previous?.color ?? nextCourseColor(),
    };
    mySchedule = {
      ...mySchedule,
      courses: [...mySchedule.courses.filter((c) => c.code !== course.code), enrolled],
    };
    return { ok: true, value: enrolled };
  },

  async removeCourse(courseId) {
    mySchedule = { ...mySchedule, courses: mySchedule.courses.filter((c) => c.id !== courseId) };
    return { ok: true, value: null };
  },

  async addEvent(draft, inviteFriendIds, replace) {
    await wait(300);
    if (!draft.name.trim()) return { ok: false, error: 'Give your event a name.' };
    replaceIfNeeded(replace, 'event');
    const event: PersonalEvent = {
      ...draft,
      name: draft.name.trim(),
      location: draft.location.trim(),
      id: newId('ev'),
      invites: inviteFriendIds.map((friendId) => ({ friendId, status: 'pending' })),
    };
    mySchedule = { ...mySchedule, events: [...mySchedule.events, event] };
    // Na vida real o servidor mandaria a notificação para cada amigo.
    if (event.invites.length) simulateFriendReplies(event);
    return { ok: true, value: event };
  },

  async removeEvent(eventId) {
    mySchedule = { ...mySchedule, events: mySchedule.events.filter((e) => e.id !== eventId) };
    return { ok: true, value: null };
  },

  async skipDate(type, id, date) {
    const skip = <T extends { id: string; skipDates?: ISODate[] }>(x: T): T =>
      x.id === id ? { ...x, skipDates: [...(x.skipDates ?? []), date] } : x;
    mySchedule =
      type === 'course'
        ? { ...mySchedule, courses: mySchedule.courses.map(skip) }
        : { ...mySchedule, events: mySchedule.events.map(skip) };
    return { ok: true, value: null };
  },

  async respondToInvite(inviteId, accept, replace) {
    await wait(300);
    const invite = incoming.find((i) => i.id === inviteId);
    if (!invite || invite.status !== 'pending') return { ok: false, error: 'This invite is no longer available.' };
    incoming = incoming.map((i) => (i.id === inviteId ? { ...i, status: accept ? 'accepted' : 'declined' } : i));
    if (!accept) return { ok: true, value: null };
    replaceIfNeeded(replace, 'event');
    const event: PersonalEvent = { ...invite.event, id: newId('ev'), invites: [], invitedBy: invite.from };
    mySchedule = { ...mySchedule, events: [...mySchedule.events, event] };
    return { ok: true, value: event };
  },

  subscribe(listener) {
    listeners.add(listener);
    if (!deliveredDemoInvites) {
      deliveredDemoInvites = true;
      setTimeout(() => {
        incoming = [...incoming, ...clone(initialIncoming)];
        notify();
      }, INCOMING_DELAY_MS);
    }
    return () => {
      listeners.delete(listener);
    };
  },
};

/** O serviço que o app usa. Troque aqui quando existir o backend. */
export const scheduleService: ScheduleService = mockScheduleService;
