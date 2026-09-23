import type { ProjectStatus } from "@/generated/prisma/enums";

/**
 * Cómo se nombra cada estado en pantalla.
 *
 * Separado de la lógica de proyectos porque el panel lo usa desde el
 * navegador, y ese archivo abre conexiones a la base de datos.
 */

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "Borrador",
  REVIEW: "En revisión",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};

/** Texto del botón que lleva a cada estado, en lenguaje de persona. */
export const STATUS_ACTIONS: Record<ProjectStatus, string> = {
  DRAFT: "Devolver a borrador",
  REVIEW: "Enviar a revisión",
  PUBLISHED: "Publicar",
  ARCHIVED: "Archivar",
};
