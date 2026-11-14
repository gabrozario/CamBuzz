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

/** Uma aula (ou compromisso) da agenda. */
export interface ClassSession {
  id: string;
  course: string; // ex.: "CS 1332"
  title: string; // ex.: "Data Structures & Algorithms"
  kind: 'Lecture' | 'Lab' | 'Recitation' | 'Study session';
  buildingId: string; // referencia Building.id
  room?: string;
  start: TimeOfDay;
  end: TimeOfDay;
}

/** /data/schedule.json — agenda do usuário para um dia. */
export interface DaySchedule {
  date: string; // "YYYY-MM-DD"
  classes: ClassSession[];
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

/** Chaves dos filtros da barra inferior. */
export type FilterKey = 'events' | 'resources' | 'food' | 'people';
