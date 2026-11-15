import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { schedule as initialSchedule } from '../../../data';
import type {
  CatalogCourse,
  ClassSession,
  EnrolledCourse,
  EventDraft,
  IncomingEventInvite,
  ISODate,
  MySchedule,
  PersonalEvent,
} from '../../types';
import { useClock } from '../../hooks/useClock';
import { classesOnDate, findConflicts, type Candidate, type Conflict } from './scheduleLogic';
import { scheduleService, type ServiceResult } from './scheduleService';

interface ScheduleContextValue {
  schedule: MySchedule;
  /** Data de "hoje" (relógio do celular; DEMO_TODAY se estiver definido). */
  today: ISODate;
  /** Suas paradas de hoje para o mapa (aulas + eventos com prédio). */
  todayClasses: ClassSession[];
  /** Eventos que cada amigo aceitou, por id do amigo. */
  friendEvents: Record<string, PersonalEvent[]>;
  /** Convites recebidos ainda sem resposta (o primeiro aparece como popup). */
  incomingInvites: IncomingEventInvite[];
  conflictsFor: (candidate: Candidate) => Conflict[];
  addCourse: (course: CatalogCourse, sectionId: string, replace?: Conflict[]) => Promise<ServiceResult<EnrolledCourse>>;
  removeCourse: (courseId: string) => Promise<void>;
  addEvent: (draft: EventDraft, friendIds: string[], replace?: Conflict[]) => Promise<ServiceResult<PersonalEvent>>;
  removeEvent: (eventId: string) => Promise<void>;
  skipDate: (type: 'course' | 'event', id: string, date: ISODate) => Promise<void>;
  respondToInvite: (
    inviteId: string,
    accept: boolean,
    replace?: Conflict[],
  ) => Promise<ServiceResult<PersonalEvent | null>>;
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

/**
 * Guarda a sua agenda num lugar só: a tela "My schedule" edita, o mapa lê
 * (caminho do dia) e o filtro People usa os eventos aceitos pelos amigos.
 * Fica em volta do app inteiro, no App.tsx.
 */
export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [schedule, setSchedule] = useState<MySchedule>(initialSchedule);
  const [friendEvents, setFriendEvents] = useState<Record<string, PersonalEvent[]>>({});
  const [incomingInvites, setIncoming] = useState<IncomingEventInvite[]>([]);
  // Data do celular, ao vivo (vira o dia sozinha à meia-noite).
  const { today } = useClock();

  const refresh = useCallback(async () => {
    const [s, f, i] = await Promise.all([
      scheduleService.getSchedule(),
      scheduleService.getFriendEvents(),
      scheduleService.getIncomingInvites(),
    ]);
    setSchedule(s);
    setFriendEvents(f);
    setIncoming(i);
  }, []);

  // Carrega e fica ouvindo mudanças "do outro lado" (amigo aceitou, chegou convite).
  useEffect(() => {
    refresh();
    return scheduleService.subscribe(refresh);
  }, [refresh]);

  /** Roda uma ação do serviço e atualiza a tela em seguida. */
  const run = useCallback(
    <T,>(action: () => Promise<T>) =>
      async (): Promise<T> => {
        const result = await action();
        await refresh();
        return result;
      },
    [refresh],
  );

  const value = useMemo<ScheduleContextValue>(
    () => ({
      schedule,
      today,
      todayClasses: classesOnDate(schedule, today),
      friendEvents,
      incomingInvites,
      conflictsFor: (candidate) => findConflicts(schedule, candidate, today),
      addCourse: (course, sectionId, replace) => run(() => scheduleService.addCourse(course, sectionId, replace))(),
      removeCourse: async (id) => {
        await run(() => scheduleService.removeCourse(id))();
      },
      addEvent: (draft, friendIds, replace) => run(() => scheduleService.addEvent(draft, friendIds, replace))(),
      removeEvent: async (id) => {
        await run(() => scheduleService.removeEvent(id))();
      },
      skipDate: async (type, id, date) => {
        await run(() => scheduleService.skipDate(type, id, date))();
      },
      respondToInvite: (inviteId, accept, replace) =>
        run(() => scheduleService.respondToInvite(inviteId, accept, replace))(),
    }),
    [schedule, today, friendEvents, incomingInvites, run],
  );

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}

export function useSchedule(): ScheduleContextValue {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error('useSchedule() must be used inside <ScheduleProvider> (see App.tsx)');
  return ctx;
}
