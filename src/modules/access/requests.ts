import { prisma } from "@/lib/prisma";

/**
 * Solicitudes del público para consultar el documento de un proyecto.
 *
 * Quien solicita no crea cuenta: deja su nombre, un correo donde recibir la
 * respuesta y el motivo. El motivo no es burocracia: es lo único con lo que
 * cuenta quien administra para decidir, porque al otro lado hay trabajos de
 * menores de edad.
 */

export interface RequestInput {
  requesterName: string;
  requesterEmail: string;
  reason: string;
}

export type RequestIssue =
  | "NAME_REQUIRED"
  | "EMAIL_REQUIRED"
  | "EMAIL_INVALID"
  | "REASON_REQUIRED"
  | "REASON_TOO_SHORT";

export type RequestValidation =
  | { valid: true }
  | { valid: false; reasons: RequestIssue[] };

export const REQUEST_MESSAGES: Record<RequestIssue, string> = {
  NAME_REQUIRED: "Escribe tu nombre.",
  EMAIL_REQUIRED: "Escribe un correo donde podamos responderte.",
  EMAIL_INVALID: "Ese correo no parece válido.",
  REASON_REQUIRED: "Cuéntanos para qué necesitas el documento.",
  REASON_TOO_SHORT:
    "Explica un poco más: con una frase suelta no hay con qué decidir.",
};

const MINIMO_MOTIVO = 20;

/** Comprobación deliberadamente laxa: un correo solo se confirma enviándole
 *  algo, y rechazar direcciones raras deja fuera a gente con correos válidos. */
function pareceCorreo(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

export function validateRequest(input: RequestInput): RequestValidation {
  const reasons: RequestIssue[] = [];
  const correo = input.requesterEmail.trim();
  const motivo = input.reason.trim();

  if (input.requesterName.trim() === "") reasons.push("NAME_REQUIRED");

  if (correo === "") {
    reasons.push("EMAIL_REQUIRED");
  } else if (!pareceCorreo(correo)) {
    reasons.push("EMAIL_INVALID");
  }

  if (motivo === "") {
    reasons.push("REASON_REQUIRED");
  } else if (motivo.length < MINIMO_MOTIVO) {
    reasons.push("REASON_TOO_SHORT");
  }

  return reasons.length === 0 ? { valid: true } : { valid: false, reasons };
}

export type CreateRequestResult =
  | { ok: true; id: string }
  | { ok: false; reason: "NOT_FOUND" | "NO_DOCUMENT" }
  | { ok: false; reasons: RequestIssue[] };

export async function createDocumentRequest(
  slug: string,
  input: RequestInput,
): Promise<CreateRequestResult> {
  const validacion = validateRequest(input);

  if (!validacion.valid) {
    return { ok: false, reasons: validacion.reasons };
  }

  // Solo proyectos publicados. Aceptar una solicitud sobre un borrador
  // confirmaría que existe antes de que nadie lo haya aprobado.
  const proyecto = await prisma.project.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, documentPath: true },
  });

  if (!proyecto) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (!proyecto.documentPath) {
    return { ok: false, reason: "NO_DOCUMENT" };
  }

  const solicitud = await prisma.documentRequest.create({
    data: {
      projectId: proyecto.id,
      requesterName: input.requesterName.trim(),
      requesterEmail: input.requesterEmail.trim().toLowerCase(),
      reason: input.reason.trim(),
    },
  });

  // La auditoría registra que hubo solicitud, no quién la hizo: los datos de
  // quien pide viven en la solicitud, que se puede borrar cuando se atienda.
  await prisma.auditLog.create({
    data: {
      action: "DOCUMENT_REQUESTED",
      entityType: "DocumentRequest",
      entityId: solicitud.id,
      metadata: { projectId: proyecto.id },
    },
  });

  return { ok: true, id: solicitud.id };
}
