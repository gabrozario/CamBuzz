// Tipos dos dados falsos em /data. Quando houver backend, a API deve devolver
// objetos neste mesmo formato.

/** Coordenada geográfica (mesmo formato que o react-native-maps usa). */
export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Horário do dia no formato 24h "HH:MM" (ex.: "09:00", "14:30"). */
export type TimeOfDay = string;

export type BuildingCategory =
  | 'academic'
  | 'library'
  | 'dining'
  | 'student-life'
  | 'recreation'
  | 'outdoor'
  | 'landmark';

/** /data/buildings.json */
export interface Building {
  id: string; // ex.: "klaus"
  name: string; // nome completo
  shortName: string; // nome curto para chips no mapa
  category: BuildingCategory;
  coordinate: LatLng;
}

/**
 * Uma parada do dia no mapa (aula ou evento com prédio). É o formato que o mapa usa;
 * a agenda semanal (MySchedule) é convertida para isto em `classesOnDate()`.
 */
export interface ClassSession {
  id: string;
  course: string; // ex.: "CS 1332" (para eventos: o nome do evento)
  title: string; // ex.: "Data Structures & Algorithms"
  kind: 'Lecture' | 'Lab' | 'Recitation' | 'Study session' | 'Event';
  buildingId: string; // referencia Building.id
  room?: string;
  start: TimeOfDay;
  end: TimeOfDay;
}

// ---------------- Agenda semanal (tela "My schedule") ----------------

/** Data no formato "YYYY-MM-DD". */
export type ISODate = string;

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

/** Um encontro semanal de uma section (ex.: Lecture seg/qua/sex 9:00–9:50 no Howey). */
export interface CourseMeeting {
  kind: 'Lecture' | 'Lab' | 'Recitation';
  days: Weekday[];
  start: TimeOfDay;
  end: TimeOfDay;
  buildingId: string;
  room?: string;
}

/** Uma section oferecida de um curso (professor + horários). /data/courses.json */
export interface CatalogSection {
  id: string; // ex.: "A"
  crn: string; // número de registro da GT
  instructor: string;
  meetings: CourseMeeting[];
}

/** Um curso do catálogo da GT. /data/courses.json (no futuro: dados do gt-scheduler). */
export interface CatalogCourse {
  code: string; // ex.: "CS 1331"
  title: string;
  credits: number;
  sections: CatalogSection[];
}

/** Um curso na SUA agenda (a section escolhida). */
export interface EnrolledCourse {
  id: string;
  code: string;
  title: string;
  sectionId: string;
  instructor: string;
  meetings: CourseMeeting[];
  color: string; // cor do curso na agenda (ver coursePalette)
  /** Dias em que esta aula NÃO acontece (ex.: substituída por um evento). */
  skipDates?: ISODate[];
}

/** "Repeat": uma vez, todo dia, dias úteis, toda semana, todo mês. */
export type RepeatRule = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

/** Situação do convite de um amigo para um evento seu. */
export interface EventInviteStatus {
  friendId: string;
  status: 'pending' | 'accepted' | 'declined';
}

/** Os campos que você preenche no "Add Event". */
export interface EventDraft {
  name: string;
  location: string; // texto livre ("Clough Commons room 102")
  /** Prédio reconhecido no texto do local — se existir, o evento aparece no mapa. */
  buildingId?: string;
  date: ISODate; // primeiro dia
  start: TimeOfDay;
  end: TimeOfDay;
  /**
   * true = termina no DIA SEGUINTE ao início (ex.: 23:30 → 02:30).
   * Nesse caso `end` é o horário no dia seguinte. Sem o campo = começa e termina no mesmo dia.
   */
  endsNextDay?: boolean;
  repeat: RepeatRule;
}

/** Um evento pessoal na agenda. */
export interface PersonalEvent extends EventDraft {
  id: string;
  invites: EventInviteStatus[];
  /** Se veio de um convite aceito: quem convidou. */
  invitedBy?: { id: string; name: string };
  skipDates?: ISODate[];
}

/** /data/schedule.json — a agenda do usuário (cursos do semestre + eventos). */
export interface MySchedule {
  term: string; // ex.: "Fall 2026"
  termStart: ISODate; // aulas só acontecem entre termStart e termEnd
  termEnd: ISODate;
  courses: EnrolledCourse[];
  events: PersonalEvent[];
}

/** Convite que você RECEBEU de um amigo (/data/invites.json na demo). */
export interface IncomingEventInvite {
  id: string;
  from: { id: string; name: string };
  event: EventDraft;
  status: 'pending' | 'accepted' | 'declined';
}

/**
 * /data/me.json — o usuário logado. No futuro vem do cadastro
 * (cada pessoa informa o email e ganha um link de convite próprio).
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  /** Parte final do link de convite: cambuzz.app/friends/<inviteSlug> */
  inviteSlug: string;
}

/** /data/directory.json — outro usuário do app (ainda não é seu amigo). */
export interface DirectoryUser {
  id: string;
  name: string;
  initials: string;
  email: string;
  inviteSlug: string;
  /** Aulas de um dia típico. Na demo, valem para todos os dias úteis (seg–sex). */
  schedule: ClassSession[];
}

/** /data/friends.json — um amigo: usuário + a cor do caminho dele no mapa. */
export interface Friend extends DirectoryUser {
  color: string; // ver friendPalette no tema
}

/** Pedido de amizade enviado por você (por email ou link). */
export interface FriendRequest {
  id: string;
  email: string;
  via: 'email' | 'link';
  status: 'pending' | 'accepted';
  createdAt: string; // ISO date
}

export type EventCategory = 'Social' | 'Community' | 'Career' | 'Food' | 'Academic' | 'Wellness' | 'Arts';

/** /data/events.json */
export interface CampusEvent {
  id: string;
  name: string;
  organization: string;
  category: EventCategory;
  description: string;
  /** Prédio onde acontece; ausente para eventos ao ar livre fora de prédios. */
  buildingId?: string;
  /** Nome do local exibido (ex.: "Tech Green · near the fountain"). */
  locationName: string;
  /** Posição exata do evento (barracas ao ar livre podem ficar fora de prédios). */
  coordinate: LatLng;
  outdoor: boolean;
  start: TimeOfDay;
  end: TimeOfDay;
}

/**
 * Uma pessoa cujo dia aparece no mapa: você ou um amigo.
 * (Formato único para o filtro People e para "quem pode ir junto" nos Eventos.)
 */
export interface Person {
  id: string; // "me" para você
  name: string; // "You" / "Maya Chen"
  shortName: string; // "You" / "Maya"
  color: string;
  isMe: boolean;
  schedule: ClassSession[];
}

/** Localização ou ponto específico de um recurso no campus (ex.: "L1" - Clough Commons). */
export interface ResourceLocation {
  id: string; // ex.: "culc-lib"
  code: string; // ex.: "L1", "P2", "R1"
  name: string; // ex.: "Clough Commons"
  buildingId: string;
  coordinate: LatLng;
  hasDetails?: boolean;
  details?: string[];
  buzzCardRestricted?: boolean;
}

/** Categoria de recurso do campus (Libraries, Printers, Campus Recreation Center). */
export interface ResourceCategory {
  id: 'libraries' | 'printers' | 'recreation';
  name: string;
  color: string;
  locations: ResourceLocation[];
}

export type OccupancyStatus = 'Busy' | 'Moderate' | 'Quiet';

export interface FloorSpaceOccupancy {
  id: string;
  name: string;
  status: OccupancyStatus;
  percentage: number;
}

export interface FloorOccupancy {
  floor: number;
  label: string;
  spaces: FloorSpaceOccupancy[];
}

export interface BuildingOccupancyDetails {
  buildingId: string;
  buildingName: string;
  subtitle: string;
  photoAttribution: string;
  floors: FloorOccupancy[];
}

/** Um prato/produto do cardápio, com a nutrição exibida no detalhe (Figma: "Food details · …"). */
export interface FoodItem {
  id: string;
  name: string; // ex.: "Scrambled eggs"
  portion: string; // ex.: "1 serving"
  tag: string; // ex.: "Eggs", "Vegan", "Grill"
  calories: number;
  protein: number; // gramas
  carbs: number; // gramas
  sugars: number; // gramas
}

/** Uma seção do cardápio (ex.: "Breakfast · 7–10:30 AM", "Drinks", "Snacks"). */
export interface FoodMenuSection {
  id: string;
  label: string;
  items: FoodItem[];
}

/** Um local de comida (D1, C2, V3...). */
export interface FoodLocation {
  id: string;
  code: string; // ex.: "D1"
  name: string; // ex.: "North Avenue Dining Hall"
  kind: string; // ex.: "Dining hall", "Coffee shop", "Vending machine"
  area: string; // ex.: "North Avenue"
  buildingId: string;
  coordinate: LatLng;
  /** Complemento do subtítulo do cardápio (ex.: "All meals"). */
  menuNote: string;
  /** Dica no rodapé do detalhe (ex.: "Scroll for breakfast, lunch & dinner ↓"). */
  scrollHint: string;
  menu: FoodMenuSection[];
}

/** Categoria de comida (Dining hall, Restaurants/Coffees, Vending machines). */
export interface FoodCategory {
  id: 'dining' | 'restaurants' | 'vending';
  name: string;
  color: string;
  locations: FoodLocation[];
}

/** Como a pessoa entrou na conta. */
export type AuthMethod = 'email' | 'google' | 'microsoft';

/** Conta logada (vem do login/cadastro; no futuro, do backend). */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  method: AuthMethod;
}

/** Chaves dos filtros da barra inferior. */
export type FilterKey = 'events' | 'resources' | 'food' | 'people';
