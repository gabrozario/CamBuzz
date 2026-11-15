import { buildings } from '../../data';
import type { Building } from '../types';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRegex = (s: string) => new RegExp(`(^|[^a-z0-9])${escape(s.toLowerCase())}($|[^a-z0-9])`);

/**
 * Reconhece um prédio da GT dentro de um texto livre de local
 * ("Clough Commons room 102" → culc). Usa o nome completo ou o curto como palavra inteira
 * (para "IC" não casar com "music"). Retorna o de nome mais longo, se houver mais de um.
 */
export function matchBuilding(text: string): Building | undefined {
  const t = text.toLowerCase();
  if (!t.trim()) return undefined;
  return buildings
    .filter((b) => wordRegex(b.name).test(t) || wordRegex(b.shortName).test(t))
    .sort((a, b) => b.shortName.length - a.shortName.length)[0];
}

/** Sugestões de prédios enquanto digita (contém o texto no nome completo ou curto). */
export function suggestBuildings(text: string, limit = 3): Building[] {
  const t = text.trim().toLowerCase();
  if (t.length < 2) return [];
  return buildings
    .filter((b) => b.name.toLowerCase().includes(t) || b.shortName.toLowerCase().includes(t))
    .slice(0, limit);
}
