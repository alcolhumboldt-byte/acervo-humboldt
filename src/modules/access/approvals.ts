import { createHash, randomBytes } from "node:crypto";
import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

/**
 * Decisión sobre las solicitudes y entrega del documento.
 *
 * Aprobar genera un enlace que caduca y sirve una sola vez. De ese enlace la
 * base de datos guarda únicamente su huella: quien tuviera acceso a la base no
 * podría reconstruirlo ni entregárselo a nadie.
 */

export interface Actor {
  id: string;
  role: Role;
}

/** Cuánto vale el enlace una vez entregado. */
export const VIGENCIA_DIAS = 7;

/** El token es una cadena larga y aleatoria, no un secreto que alguien
 *  recuerde, así que un resumen rápido basta: no hay nada que adivinar. */
function huella(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function listPendingRequests() {
  const solicitudes = await prisma.documentRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      requesterName: true,
      requesterEmail: true,
      reason: true,
      createdAt: true,
      project: { select: { title: true, slug: true } },
    },
  });

  return solicitudes.map((s) => ({
    id: s.id,
    requesterName: s.requesterName,
    requesterEmail: s.requesterEmail,
    reason: s.reason,
    createdAt: s.createdAt,
    projectTitle: s.project.title,
    projectSlug: s.project.slug,
  }));
}

export type DecisionResult =
  | { ok: true; token: string }
  | { ok: false; reason: "NOT_FOUND" | "NOT_ALLOWED" | "ALREADY_DECIDED" };

async function emitirEnlace(
  id: string,
  actor: Actor,
  accion: string,
  projectId: string,
): Promise<string> {
  const token = randomBytes(32).toString("base64url");

  await prisma.documentRequest.update({
    where: { id },
    data: {
      status: "APPROVED",
      decidedAt: new Date(),
      decidedById: actor.id,
      tokenHash: huella(token),
      tokenExpiresAt: new Date(Date.now() + VIGENCIA_DIAS * 86_400_000),
      // Un enlace nuevo deja sin efecto al anterior, incluso si ya se había
      // usado: lo que vale es siempre el último emitido.
      tokenUsedAt: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: accion,
      entityType: "DocumentRequest",
      entityId: id,
      actorId: actor.id,
      metadata: { projectId },
    },
  });

  return token;
}

export async function approveRequest(
  id: string,
  actor: Actor,
): Promise<DecisionResult> {
  if (actor.role !== "ADMIN") {
    return { ok: false, reason: "NOT_ALLOWED" };
  }

  const solicitud = await prisma.documentRequest.findUnique({
    where: { id },
    select: { id: true, status: true, projectId: true },
  });

  if (!solicitud) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (solicitud.status !== "PENDING") {
    return { ok: false, reason: "ALREADY_DECIDED" };
  }

  // El token en claro sale de aquí una sola vez y no vuelve a existir.
  const token = await emitirEnlace(
    id,
    actor,
    "REQUEST_APPROVED",
    solicitud.projectId,
  );

  return { ok: true, token };
}

/**
 * Emite un enlace nuevo para una solicitud ya aprobada.
 *
 * Del enlace solo se guarda su huella, así que cerrar la pestaña basta para
 * perderlo. Sin esta salida, un descuido obligaría a pedirle a la persona que
 * volviera a solicitar el documento desde cero.
 *
 * El enlace anterior deja de servir en el momento en que se emite el nuevo.
 */
export async function reissueToken(
  id: string,
  actor: Actor,
): Promise<DecisionResult> {
  if (actor.role !== "ADMIN") {
    return { ok: false, reason: "NOT_ALLOWED" };
  }

  const solicitud = await prisma.documentRequest.findUnique({
    where: { id },
    select: { id: true, status: true, projectId: true },
  });

  if (!solicitud) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (solicitud.status !== "APPROVED") {
    return { ok: false, reason: "ALREADY_DECIDED" };
  }

  const token = await emitirEnlace(
    id,
    actor,
    "REQUEST_LINK_REISSUED",
    solicitud.projectId,
  );

  return { ok: true, token };
}

/** Aprobadas cuyo enlace aún no se ha usado, por si hay que reenviarlo. */
export async function listApprovedRequests() {
  const solicitudes = await prisma.documentRequest.findMany({
    where: { status: "APPROVED" },
    orderBy: { decidedAt: "desc" },
    take: 30,
    select: {
      id: true,
      requesterName: true,
      requesterEmail: true,
      decidedAt: true,
      tokenUsedAt: true,
      tokenExpiresAt: true,
      project: { select: { title: true } },
    },
  });

  return solicitudes.map((s) => ({
    id: s.id,
    requesterName: s.requesterName,
    requesterEmail: s.requesterEmail,
    decidedAt: s.decidedAt,
    usado: s.tokenUsedAt !== null,
    caducado:
      s.tokenExpiresAt !== null && s.tokenExpiresAt < new Date(),
    projectTitle: s.project.title,
  }));
}

export async function rejectRequest(
  id: string,
  actor: Actor,
  nota: string,
): Promise<
  { ok: true } | { ok: false; reason: "NOT_FOUND" | "NOT_ALLOWED" | "ALREADY_DECIDED" }
> {
  if (actor.role !== "ADMIN") {
    return { ok: false, reason: "NOT_ALLOWED" };
  }

  const solicitud = await prisma.documentRequest.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!solicitud) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (solicitud.status !== "PENDING") {
    return { ok: false, reason: "ALREADY_DECIDED" };
  }

  await prisma.documentRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      decidedAt: new Date(),
      decidedById: actor.id,
      decisionNote: nota.trim() === "" ? null : nota.trim(),
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "REQUEST_REJECTED",
      entityType: "DocumentRequest",
      entityId: id,
      actorId: actor.id,
      metadata: {},
    },
  });

  return { ok: true };
}

/**
 * Mira el estado de un enlace sin gastarlo.
 *
 * Existe porque las aplicaciones de mensajería y los clientes de correo
 * previsualizan los enlaces abriéndolos. Si el documento se entregara al
 * abrir la página, esa previsualización quemaría el enlace antes de que la
 * persona llegara a pulsar nada.
 */
export async function inspectToken(token: string): Promise<
  | { estado: "VALIDO"; projectTitle: string }
  | { estado: "USADO" | "CADUCADO" | "NO_EXISTE" | "SIN_DOCUMENTO" }
> {
  const solicitud = await prisma.documentRequest.findUnique({
    where: { tokenHash: huella(token) },
    select: {
      tokenExpiresAt: true,
      tokenUsedAt: true,
      project: { select: { title: true, documentPath: true } },
    },
  });

  if (!solicitud) return { estado: "NO_EXISTE" };
  if (solicitud.tokenUsedAt) return { estado: "USADO" };
  if (solicitud.tokenExpiresAt && solicitud.tokenExpiresAt < new Date()) {
    return { estado: "CADUCADO" };
  }
  if (!solicitud.project.documentPath) return { estado: "SIN_DOCUMENTO" };

  return { estado: "VALIDO", projectTitle: solicitud.project.title };
}

export type RedeemResult =
  | { ok: true; documentPath: string; projectTitle: string; projectSlug: string }
  | {
      ok: false;
      reason: "NOT_FOUND" | "ALREADY_USED" | "EXPIRED" | "NO_DOCUMENT";
    };

/**
 * Canjea el enlace por el documento.
 *
 * La marca de uso se pone con una escritura condicional que exige que siga sin
 * usar. Comprobarlo antes y escribirlo después dejaría pasar a dos personas que
 * pulsaran a la vez, y el enlace de «un solo uso» no lo sería.
 */
export async function redeemToken(token: string): Promise<RedeemResult> {
  const hash = huella(token);

  const solicitud = await prisma.documentRequest.findUnique({
    where: { tokenHash: hash },
    select: {
      id: true,
      tokenExpiresAt: true,
      tokenUsedAt: true,
      project: { select: { title: true, slug: true, documentPath: true } },
    },
  });

  if (!solicitud) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (solicitud.tokenUsedAt) {
    return { ok: false, reason: "ALREADY_USED" };
  }

  if (solicitud.tokenExpiresAt && solicitud.tokenExpiresAt < new Date()) {
    return { ok: false, reason: "EXPIRED" };
  }

  if (!solicitud.project.documentPath) {
    return { ok: false, reason: "NO_DOCUMENT" };
  }

  const marcada = await prisma.documentRequest.updateMany({
    where: { id: solicitud.id, tokenUsedAt: null },
    data: { tokenUsedAt: new Date() },
  });

  // Si no se actualizó ninguna fila, otra petición llegó primero.
  if (marcada.count !== 1) {
    return { ok: false, reason: "ALREADY_USED" };
  }

  await prisma.auditLog.create({
    data: {
      action: "DOCUMENT_DELIVERED",
      entityType: "DocumentRequest",
      entityId: solicitud.id,
      metadata: {},
    },
  });

  return {
    ok: true,
    documentPath: solicitud.project.documentPath,
    projectTitle: solicitud.project.title,
    projectSlug: solicitud.project.slug,
  };
}
