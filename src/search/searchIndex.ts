import { buildings, events, foodCategories, getBuilding, resourceCategories } from '../../data';
import type { EnrolledCourse, FilterKey, Friend, TimeOfDay } from '../types';
import { formatDaysShort } from '../utils/dates';
import { formatTime, formatTimeRange, toMinutes } from '../utils/time';

// LÓGICA PURA da busca (sem React): monta a lista de tudo que dá para pesquisar e ordena por relevância.

/** O que acontece ao tocar no resultado (o MapScreen executa — ver onSearchSelect). */
export type SearchTarget =
  | { type: 'building'; buildingId: string }
  | { type: 'resource'; locationId: string }
  | { type: 'food'; locationId: string }
  | { type: 'event'; eventId: string }
  | { type: 'friend'; friendId: string }
  | { type: 'course'; courseId: string }
  | { type: 'category'; filter: FilterKey; categoryId?: string };

export type SearchGroup = 'Friends' | 'Your classes' | 'Food' | 'Resources' | 'Events' | 'Buildings' | 'Shortcuts';

/** Ícone a desenhar na linha (a tela escolhe o desenho). */
export type SearchIcon =
  | 'building'
  | 'library'
  | 'printer'
  | 'gym'
  | 'dining'
  | 'restaurant'
  | 'coffee'
  | 'vending'
  | 'event'
  | 'friend'
  | 'course'
  | 'shortcut';

export interface SearchItem {
  key: string;
  group: SearchGroup;
  icon: SearchIcon;
  title: string;
  subtitle: string;
  /** Cor do ícone (categoria, cor do amigo...). */
  color?: string;
  /** Palavras extras que também acham o item (ex.: código "C3", tags, email). */
  keywords: string[];
  target: SearchTarget;
}

/** Ordem dos grupos nos resultados. */
export const GROUP_ORDER: SearchGroup[] = ['Friends', 'Your classes', 'Food', 'Resources', 'Events', 'Buildings', 'Shortcuts'];

interface IndexInput {
  friends: Friend[];
  /** Texto curto de onde cada amigo está agora (ex.: "Library now"), por id. */
  friendStatus: Record<string, string>;
  courses: EnrolledCourse[];
  now: TimeOfDay;
}

const RESOURCE_ICON: Record<string, SearchIcon> = { libraries: 'library', printers: 'printer', recreation: 'gym' };
const FOOD_ICON: Record<string, SearchIcon> = { dining: 'dining', restaurants: 'restaurant', vending: 'vending' };
const RESOURCE_SINGULAR: Record<string, string> = { libraries: 'Library', printers: 'Printer', recreation: 'Campus Rec' };

/** Nome claro na busca: "Price Gilbert Library", "Printer · Klaus", "CRC · Weights". */
function resourceTitle(categoryId: string, name: string): string {
  if (categoryId === 'libraries') return /library/i.test(name) ? name : `${name} Library`;
  if (categoryId === 'printers') return `Printer · ${name}`;
  if (categoryId === 'recreation') return `CRC · ${name}`;
  return name;
}

/** Tudo que dá para pesquisar no app. */
export function buildSearchIndex({ friends, friendStatus, courses, now }: IndexInput): SearchItem[] {
  const items: SearchItem[] = [];

  for (const f of friends) {
    items.push({
      key: `friend-${f.id}`,
      group: 'Friends',
      icon: 'friend',
      title: f.name,
      subtitle: friendStatus[f.id] ?? 'Friend',
      color: f.color,
      keywords: [f.email, 'friend', 'friends'],
      target: { type: 'friend', friendId: f.id },
    });
  }

  for (const c of courses) {
    const m = c.meetings[0];
    items.push({
      key: `course-${c.id}`,
      group: 'Your classes',
      icon: 'course',
      title: `${c.code} · ${c.title}`,
      subtitle: `${formatDaysShort(m.days)} ${formatTimeRange(m.start, m.end)} · ${getBuilding(m.buildingId).shortName}${m.room ? ` ${m.room}` : ''}`,
      color: c.color,
      keywords: [c.code.replace(' ', ''), c.instructor, 'class', 'course'],
      target: { type: 'course', courseId: c.id },
    });
  }

  for (const cat of foodCategories) {
    for (const loc of cat.locations) {
      items.push({
        key: `food-${loc.id}`,
        group: 'Food',
        icon: loc.kind === 'Coffee shop' ? 'coffee' : FOOD_ICON[cat.id],
        title: loc.name,
        subtitle: `${loc.kind} · ${loc.area}`,
        color: cat.color,
        keywords: [loc.code, cat.name, loc.kind, ...(loc.tags ?? [])],
        target: { type: 'food', locationId: loc.id },
      });
    }
  }

  for (const cat of resourceCategories) {
    for (const loc of cat.locations) {
      items.push({
        key: `resource-${loc.id}`,
        group: 'Resources',
        icon: RESOURCE_ICON[cat.id] ?? 'building',
        title: resourceTitle(cat.id, loc.name),
        subtitle: `${RESOURCE_SINGULAR[cat.id] ?? cat.name} · ${loc.code}`,
        color: cat.color,
        keywords: [loc.code, cat.name, RESOURCE_SINGULAR[cat.id] ?? '', ...(loc.details ?? [])],
        target: { type: 'resource', locationId: loc.id },
      });
    }
  }

  for (const e of events) {
    if (toMinutes(e.end) <= toMinutes(now)) continue; // já acabou
    items.push({
      key: `event-${e.id}`,
      group: 'Events',
      icon: 'event',
      title: e.name,
      subtitle: `${formatTime(e.start)} · ${e.locationName}`,
      keywords: [e.organization, e.category, 'event'],
      target: { type: 'event', eventId: e.id },
    });
  }

  for (const b of buildings) {
    items.push({
      key: `building-${b.id}`,
      group: 'Buildings',
      icon: 'building',
      title: b.name,
      subtitle: b.shortName !== b.name ? `Building · ${b.shortName}` : 'Building',
      keywords: [b.shortName, b.id],
      target: { type: 'building', buildingId: b.id },
    });
  }

  // Atalhos: liga o filtro já com a categoria marcada.
  const shortcut = (title: string, subtitle: string, filter: FilterKey, categoryId?: string, keywords: string[] = []) =>
    items.push({
      key: `shortcut-${filter}-${categoryId ?? 'all'}`,
      group: 'Shortcuts',
      icon: 'shortcut',
      title,
      subtitle,
      keywords,
      target: { type: 'category', filter, categoryId },
    });
  shortcut('All restaurants & coffee', 'Food', 'food', 'restaurants', ['food', 'eat', 'coffee', 'cafe']);
  shortcut('Dining halls', 'Food', 'food', 'dining', ['food', 'eat', 'meal']);
  shortcut('Vending machines', 'Food', 'food', 'vending', ['snack']);
  shortcut('Libraries', 'Resources', 'resources', 'libraries', ['library', 'study']);
  shortcut('Printers', 'Resources', 'resources', 'printers', ['print', 'printer']);
  shortcut('Campus Recreation Center', 'Resources', 'resources', 'recreation', ['gym', 'crc']);
  shortcut('Events on your route', 'Events', 'events', undefined, ['events', 'today']);
  shortcut('Friends', 'See where your friends are', 'people', undefined, ['people']);

  return items;
}

/** Minúsculas, sem acento e sem pontuação: "Kinnamōns" → "kinnamons", "Chick-fil-A" → "chick fil a". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Relevância de um item para a busca (0 = não combina). */
function score(item: SearchItem, q: string): number {
  const title = normalize(item.title);
  const compactQ = q.replace(/ /g, '');
  if (title === q) return 100;
  if (title.startsWith(q)) return 80;
  if (title.split(' ').some((w) => w.startsWith(q))) return 60;
  if (title.replace(/ /g, '').includes(compactQ)) return 45;
  const keywords = item.keywords.map(normalize);
  if (keywords.some((k) => k === q || k.replace(/ /g, '') === compactQ)) return 55; // ex.: código "C3", "CS1332"
  if (keywords.some((k) => k.split(' ').some((w) => w.startsWith(q)))) return 30;
  if (normalize(item.subtitle).includes(q)) return 20;
  // Várias palavras: todas precisam aparecer em algum lugar.
  const words = q.split(' ');
  if (words.length > 1) {
    const all = `${title} ${keywords.join(' ')} ${normalize(item.subtitle)}`;
    if (words.every((w) => all.includes(w))) return 15;
  }
  return 0;
}

/** Itens que combinam com a busca, do mais para o menos relevante (no máximo `limit`). */
export function searchItems(index: SearchItem[], query: string, limit = 40): SearchItem[] {
  const q = normalize(query);
  if (!q) return [];
  return index
    .map((item) => ({ item, s: score(item, q) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || GROUP_ORDER.indexOf(a.item.group) - GROUP_ORDER.indexOf(b.item.group))
    .slice(0, limit)
    .map((r) => r.item);
}
