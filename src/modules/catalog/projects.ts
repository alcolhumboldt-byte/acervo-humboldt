import type { ProjectStatus, Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/modules/catalog/slug";
import { buildSearchText } from "@/modules/discovery/search-text";

/**
 * Alta y mantenimiento de proyectos desde el panel interno.
 *
 * Aquí vive la regla de publicación: un proyecto no sale al portal sin que un
 * administrador lo apruebe. Los docentes preparan y envían a revisión; el paso
 * final es de quien administra.
 */

export interface AuthorInput {
  givenNames: string;
  familyNames: string;
  fullNameAuthorized: boolean;
}

export interface ProjectInput {
  title: string;
  summary: string;
  area: string;
  gradeLevel: number;
  year: number;
  authors: AuthorInput[];
}

export interface Actor {
  id: string;
  role: Role;
}

export type ValidationIssue =
  | "TITLE_REQUIRED"
  | "SUMMARY_REQUIRED"
  | "AREA_REQUIRED"
  | "GRADE_OUT_OF_RANGE"
  | "YEAR_OUT_OF_RANGE"
  | "AUTHORS_REQUIRED"
  | "AUTHOR_NAME_REQUIRED";

export type ValidationResult =
  | { valid: true }
  | { valid: false; reasons: ValidationIssue[] };

export const VALIDATION_MESSAGES: Record<ValidationIssue, string> = {
  TITLE_REQUIRED: "El proyecto necesita un título.",
  SUMMARY_REQUIRED: "Escribe un resumen del proyecto.",
  AREA_REQUIRED: "Indica el área académica.",
  GRADE_OUT_OF_RANGE: "El grado debe ir de preescolar a once.",
  YEAR_OUT_OF_RANGE: "Revisa el año lectivo.",
  AUTHORS_REQUIRED: "Añade al menos un autor.",
  AUTHOR_NAME_REQUIRED: "Cada autor necesita nombres y apellidos.",
};

const ANIO_MINIMO = 2000;

export function validateProject(input: ProjectInput): ValidationResult {
  const reasons = new Set<ValidationIssue>();
  const anioMaximo = new Date().getFullYear() + 1;

  if (input.title.trim() === "") reasons.add("TITLE_REQUIRED");
  if (input.summary.trim() === "") reasons.add("SUMMARY_REQUIRED");
  if (input.area.trim() === "") reasons.add("AREA_REQUIRED");

  if (
    !Number.isInteger(input.gradeLevel) ||
    input.gradeLevel < 0 ||
    input.gradeLevel > 11
  ) {
    reasons.add("GRADE_OUT_OF_RANGE");
  }

  if (
    !Number.isInteger(input.year) ||
    input.year < ANIO_MINIMO ||
    input.year > anioMaximo
  ) {
    reasons.add("YEAR_OUT_OF_RANGE");
  }

  if (input.authors.length === 0) {
    reasons.add("AUTHORS_REQUIRED");
  }

  if (
    input.authors.some(
      (a) => a.givenNames.trim() === "" || a.familyNames.trim() === "",
    )
  ) {
    reasons.add("AUTHOR_NAME_REQUIRED");
  }

  return reasons.size === 0
    ? { valid: true }
    : { valid: false, reasons: [...reasons] };
}

/**
 * Transiciones permitidas y quién puede hacerlas.
 *
 * Publicar y archivar quedan reservados a administración: es la decisión de
 * que nada salga al público sin aprobación.
 */
const TRANSICIONES: Record<ProjectStatus, Partial<Record<ProjectStatus, Role[]>>> =
  {
    DRAFT: { REVIEW: ["ADMIN", "DOCENTE"] },
    REVIEW: { DRAFT: ["ADMIN", "DOCENTE"], PUBLISHED: ["ADMIN"] },
    PUBLISHED: { REVIEW: ["ADMIN"], ARCHIVED: ["ADMIN"] },
    ARCHIVED: { PUBLISHED: ["ADMIN"] },
  };

/** Cambios de estado que esta persona puede hacer desde el estado actual.
 *  El panel dibuja solo estos botones, y el servicio vuelve a comprobarlo. */
export function allowedTransitions(
  actual: ProjectStatus,
  role: Role,
): ProjectStatus[] {
  return Object.entries(TRANSICIONES[actual])
    .filter(([, roles]) => roles?.includes(role))
    .map(([destino]) => destino as ProjectStatus);
}

function datosEscalares(input: ProjectInput) {
  return {
    title: input.title.trim(),
    summary: input.summary.trim(),
    area: input.area.trim(),
    gradeLevel: input.gradeLevel,
    year: input.year,
    searchText: buildSearchText({
      title: input.title,
      summary: input.summary,
      area: input.area,
    }),
  };
}

function autoresLimpios(input: ProjectInput) {
  return input.authors.map((a) => ({
    givenNames: a.givenNames.trim(),
    familyNames: a.familyNames.trim(),
    fullNameAuthorized: a.fullNameAuthorized,
  }));
}

/** La auditoría guarda la dirección del proyecto, nunca nombres de autores. */
async function registrar(
  action: string,
  actor: Actor,
  entityId: string,
  metadata: Record<string, string> = {},
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action,
      entityType: "Project",
      entityId,
      actorId: actor.id === "" ? null : actor.id,
      metadata,
    },
  });
}

export type CreateResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; reasons: ValidationIssue[] };

export async function createProject(
  input: ProjectInput,
  actor: Actor,
): Promise<CreateResult> {
  const validacion = validateProject(input);

  if (!validacion.valid) {
    return { ok: false, reasons: validacion.reasons };
  }

  const slug = await uniqueSlug(input.title, async (candidato) => {
    const existe = await prisma.project.findUnique({
      where: { slug: candidato },
      select: { id: true },
    });
    return existe !== null;
  });

  const proyecto = await prisma.project.create({
    data: {
      ...datosEscalares(input),
      slug,
      status: "DRAFT",
      authors: { create: autoresLimpios(input) },
    },
  });

  await registrar("PROJECT_CREATED", actor, proyecto.id, { slug });

  return { ok: true, id: proyecto.id, slug };
}

export type UpdateResult =
  | { ok: true }
  | { ok: false; reasons: ValidationIssue[] }
  | { ok: false; reason: "NOT_FOUND" };

export async function updateProject(
  id: string,
  input: ProjectInput,
  actor: Actor,
): Promise<UpdateResult> {
  const validacion = validateProject(input);

  if (!validacion.valid) {
    return { ok: false, reasons: validacion.reasons };
  }

  const existente = await prisma.project.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existente) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  // La dirección no se recalcula: cambiarla rompería los enlaces que alguien
  // ya haya guardado o compartido.
  await prisma.$transaction([
    prisma.author.deleteMany({ where: { projectId: id } }),
    prisma.project.update({
      where: { id },
      data: {
        ...datosEscalares(input),
        authors: { create: autoresLimpios(input) },
      },
    }),
  ]);

  await registrar("PROJECT_UPDATED", actor, id);

  return { ok: true };
}

export type StatusResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | "INVALID_TRANSITION" | "NOT_ALLOWED" };

export async function changeStatus(
  id: string,
  siguiente: ProjectStatus,
  actor: Actor,
): Promise<StatusResult> {
  const proyecto = await prisma.project.findUnique({
    where: { id },
    select: { id: true, status: true, publishedAt: true },
  });

  if (!proyecto) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const permitidos = TRANSICIONES[proyecto.status][siguiente];

  if (!permitidos) {
    return { ok: false, reason: "INVALID_TRANSITION" };
  }

  if (!permitidos.includes(actor.role)) {
    return { ok: false, reason: "NOT_ALLOWED" };
  }

  await prisma.project.update({
    where: { id },
    data: {
      status: siguiente,
      // La fecha de publicación se fija la primera vez y ya no se mueve:
      // es cuándo el trabajo se hizo público, no cuándo se tocó por última vez.
      publishedAt:
        siguiente === "PUBLISHED" && proyecto.publishedAt === null
          ? new Date()
          : proyecto.publishedAt,
    },
  });

  await registrar("PROJECT_STATUS_CHANGED", actor, id, {
    from: proyecto.status,
    to: siguiente,
  });

  return { ok: true };
}

/** Todos los proyectos, en cualquier estado. Solo para el panel interno. */
export async function listProjectsForPanel() {
  return prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      area: true,
      gradeLevel: true,
      year: true,
      status: true,
      updatedAt: true,
      _count: { select: { authors: true } },
    },
  });
}

export async function getProjectForPanel(id: string) {
  return prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      area: true,
      gradeLevel: true,
      year: true,
      status: true,
      documentPath: true,
      documentSize: true,
      documentUploadedAt: true,
      authors: {
        select: {
          givenNames: true,
          familyNames: true,
          fullNameAuthorized: true,
        },
      },
    },
  });
}
