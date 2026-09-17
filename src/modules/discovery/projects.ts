import { prisma } from "@/lib/prisma";
import { displayAuthorName } from "@/modules/discovery/author-name";

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

const GRADE_NAMES = [
  "Preescolar",
  "Primero",
  "Segundo",
  "Tercero",
  "Cuarto",
  "Quinto",
  "Sexto",
  "Séptimo",
  "Octavo",
  "Noveno",
  "Décimo",
  "Once",
];

export function gradeLabel(level: number): string {
  return GRADE_NAMES[level] ?? "Sin grado";
}

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
