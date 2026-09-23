import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { displayAuthorName } from "@/modules/discovery/author-name";
import { normalizeForSearch } from "@/modules/discovery/search-text";

export { gradeLabel } from "@/modules/discovery/grades";

/**
 * Consultas del portal público.
 *
 * Todo lo que sale de aquí es visible para cualquiera en internet. Por eso la
 * consulta filtra por estado PUBLISHED y convierte los nombres de los autores
 * antes de devolverlos: el nombre completo de un estudiante no debe llegar
 * nunca a la capa de presentación, ni siquiera para descartarlo allí.
 */

export interface PublicProject {
  slug: string;
  title: string;
  summary: string;
  area: string;
  gradeLevel: number;
  year: number;
  authors: string[];
}

/** Campos que el portal puede mostrar. Nada más sale de la base. */
const CAMPOS_PUBLICOS = {
  slug: true,
  title: true,
  summary: true,
  area: true,
  gradeLevel: true,
  year: true,
  authors: {
    select: {
      givenNames: true,
      familyNames: true,
      fullNameAuthorized: true,
    },
  },
} as const;

type ProyectoConAutores = Omit<PublicProject, "authors"> & {
  authors: Parameters<typeof displayAuthorName>[0][];
};

function toPublicProject(proyecto: ProyectoConAutores): PublicProject {
  return {
    ...proyecto,
    authors: proyecto.authors.map(displayAuthorName),
  };
}

export async function listPublishedProjects({
  limit,
}: { limit?: number } = {}): Promise<PublicProject[]> {
  const proyectos = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: CAMPOS_PUBLICOS,
  });

  return proyectos.map(toPublicProject);
}

/**
 * Busca un proyecto por su slug.
 *
 * El filtro de estado va en la consulta, no después: un proyecto sin publicar
 * no debe salir de la base ni siquiera para descartarlo en la página.
 */
export async function getPublishedProject(
  slug: string,
): Promise<PublicProject | null> {
  const proyecto = await prisma.project.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: CAMPOS_PUBLICOS,
  });

  return proyecto ? toPublicProject(proyecto) : null;
}

export const PAGE_SIZE = 12;

export interface ProjectFilters {
  area?: string;
  gradeLevel?: number;
  year?: number;
  query?: string;
  page?: number;
}

export interface SearchResult {
  projects: PublicProject[];
  total: number;
  page: number;
  pageCount: number;
}

export interface FilterOptions {
  areas: string[];
  grades: number[];
  years: number[];
}

export async function searchPublishedProjects({
  area,
  gradeLevel,
  year,
  query,
  page = 1,
}: ProjectFilters): Promise<SearchResult> {
  const pagina = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;

  const where: Prisma.ProjectWhereInput = {
    status: "PUBLISHED",
    ...(area ? { area } : {}),
    ...(gradeLevel === undefined ? {} : { gradeLevel }),
    ...(year === undefined ? {} : { year }),
    // La búsqueda va contra searchText, que ya está sin tildes y en
    // minúsculas, así que la consulta se normaliza igual antes de comparar.
    ...(query ? { searchText: { contains: normalizeForSearch(query) } } : {}),
  };

  const [total, proyectos] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (pagina - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: CAMPOS_PUBLICOS,
    }),
  ]);

  return {
    projects: proyectos.map(toPublicProject),
    total,
    page: pagina,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/**
 * Valores disponibles para los filtros.
 *
 * Solo salen de proyectos publicados: ofrecer un área que únicamente existe en
 * un borrador delataría que ese borrador existe.
 *
 * Se recorren todos los publicados en una sola consulta. Para el tamaño de un
 * archivo escolar es más barato que tres consultas distintas.
 */
export async function getFilterOptions(): Promise<FilterOptions> {
  const proyectos = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    select: { area: true, gradeLevel: true, year: true },
  });

  return {
    areas: [...new Set(proyectos.map((p) => p.area))].sort((a, b) =>
      a.localeCompare(b, "es"),
    ),
    grades: [...new Set(proyectos.map((p) => p.gradeLevel))].sort(
      (a, b) => a - b,
    ),
    years: [...new Set(proyectos.map((p) => p.year))].sort((a, b) => b - a),
  };
}

export interface ArchiveStats {
  projectCount: number;
  areaCount: number;
  firstYear: number | null;
  lastYear: number | null;
}

/**
 * Cifras del archivo para la portada.
 *
 * Son datos reales de la base, no adornos: si el archivo está vacío devuelven
 * cero y la portada lo dice, en lugar de inventar un número.
 */
export async function getArchiveStats(): Promise<ArchiveStats> {
  const proyectos = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    select: { area: true, year: true },
  });

  const years = proyectos.map((p) => p.year);

  return {
    projectCount: proyectos.length,
    areaCount: new Set(proyectos.map((p) => p.area)).size,
    firstYear: years.length === 0 ? null : Math.min(...years),
    lastYear: years.length === 0 ? null : Math.max(...years),
  };
}
