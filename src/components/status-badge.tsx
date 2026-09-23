import type { ProjectStatus } from "@/generated/prisma/enums";
import { STATUS_LABELS } from "@/modules/catalog/status";

/** Solo «Publicado» lleva el color de acento: es el único estado visible
 *  fuera del colegio, y conviene distinguirlo de un vistazo. */
const ESTILOS: Record<ProjectStatus, string> = {
  DRAFT: "bg-papel text-gris-texto ring-gris",
  REVIEW: "bg-papel text-azul ring-azul",
  PUBLISHED: "bg-morado text-blanco ring-morado",
  ARCHIVED: "bg-papel text-gris-texto ring-gris",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${ESTILOS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
