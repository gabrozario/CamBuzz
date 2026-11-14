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

/** /data/friends.json */
export interface Friend {
  id: string;
  name: string;
  initials: string;
  color: string; // cor do caminho no mapa (ver friendPalette no tema)
  schedule: ClassSession[];
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

/** Chaves dos filtros da barra inferior. */
export type FilterKey = 'events' | 'resources' | 'food' | 'people';
