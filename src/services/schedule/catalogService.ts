import { courseCatalog } from '../../../data';
import type { CatalogCourse } from '../../types';

/**
 * Catálogo de cursos e sections da GT.
 *
 * HOJE: amostra em /data/courses.json (12 cursos).
 * FUTURO: todos os cursos do semestre a partir do gt-scheduler (github.com/gt-scheduler).
 * O crawler deles publica um JSON por semestre com cada curso, suas sections, CRN,
 * professores, dias/horários e local. Plano:
 *   1. Baixar o JSON do semestre (no backend ou num script, não a cada abertura do app).
 *   2. Converter para o formato `CatalogCourse` (src/types) — dias "MWF" → ['Mon','Wed','Fri'],
 *      horário "0825 - 0915" → start "08:25" / end "09:15", local "Klaus 1443" → buildingId "klaus" + room.
 *      (Confira o formato exato no repositório deles antes de escrever o conversor.)
 *   3. Criar `apiCatalogService` com as mesmas funções abaixo e trocar a última linha deste arquivo.
 */
export interface CatalogService {
  /** Acha um curso pelo código ("cs1331", "CS 1331"...). */
  findCourse(code: string): Promise<CatalogCourse | null>;
  /** Sugestões enquanto a pessoa digita (até `limit`). */
  suggest(query: string, limit?: number): Promise<CatalogCourse[]>;
}

/** "cs1331" / "Cs  1331" -> "CS 1331" */
export function normalizeCourseCode(raw: string): string {
  const compact = raw.toUpperCase().replace(/\s+/g, '');
  const match = compact.match(/^([A-Z]+)(\d+[A-Z]?)$/);
  return match ? `${match[1]} ${match[2]}` : raw.trim().toUpperCase();
}

const compactCode = (code: string) => code.replace(/\s+/g, '').toUpperCase();

export const mockCatalogService: CatalogService = {
  async findCourse(code) {
    const wanted = compactCode(code);
    return courseCatalog.find((c) => compactCode(c.code) === wanted) ?? null;
  },
  async suggest(query, limit = 4) {
    const q = compactCode(query);
    if (!q) return [];
    return courseCatalog
      .filter((c) => compactCode(c.code).startsWith(q) || c.title.toUpperCase().includes(query.trim().toUpperCase()))
      .slice(0, limit);
  },
};

/** O catálogo que o app usa. Troque aqui quando existir o backend / dados do gt-scheduler. */
export const catalogService: CatalogService = mockCatalogService;
