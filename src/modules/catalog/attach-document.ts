import { prisma } from "@/lib/prisma";
import {
  MAX_DOCUMENT_BYTES,
  documentPathFor,
  validateDocument,
  type DocumentIssue,
} from "@/modules/catalog/document";
import type { Actor } from "@/modules/catalog/projects";

/**
 * Adjuntar y quitar el PDF de un proyecto.
 *
 * El archivo NO pasa por el servidor. La plataforma donde corre la aplicación
 * limita a 4,5 MB el cuerpo de una petición, y el tope acordado para un
 * documento es de 25 MB: subirlo por aquí fallaría en cuanto el PDF pasara de
 * unas pocas páginas escaneadas.
 *
 * En su lugar el servidor concede un permiso temporal para escribir en una
 * ruta concreta, el navegador sube el archivo directamente al almacenamiento,
 * y después el servidor lo descarga para comprobarlo. Esa comprobación es
 * imprescindible: entre conceder el permiso y confirmar la subida, lo que se
 * haya escrito allí lo eligió el navegador.
 */

export interface DocumentStorage {
  /** Permiso temporal para escribir en esa ruta. */
  createUploadUrl(path: string): Promise<{ url: string; token: string }>;
  download(path: string): Promise<Uint8Array>;
  remove(path: string): Promise<void>;
}

export type PrepareResult =
  | { ok: true; path: string; url: string; token: string }
  | { ok: false; reason: "NOT_FOUND" };

export type ConfirmResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | "WRONG_PATH" | "MISSING_FILE" }
  | { ok: false; reasons: DocumentIssue[] };

/** La ruta la construye el servidor; al confirmar se comprueba que la que
 *  devuelve el navegador sea de ese proyecto y no de otro. */
function rutaPerteneceA(path: string, projectId: string): boolean {
  return new RegExp(`^proyectos/${projectId}/[a-z0-9-]+\\.pdf$`).test(path);
}

async function registrar(
  action: string,
  actor: Actor,
  projectId: string,
  metadata: Record<string, string | number> = {},
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action,
      entityType: "Project",
      entityId: projectId,
      actorId: actor.id === "" ? null : actor.id,
      metadata,
    },
  });
}

export async function prepareUpload(
  projectId: string,
  storage: DocumentStorage,
): Promise<PrepareResult> {
  const proyecto = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!proyecto) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const path = documentPathFor(projectId);
  const { url, token } = await storage.createUploadUrl(path);

  return { ok: true, path, url, token };
}

export async function confirmUpload(
  projectId: string,
  path: string,
  actor: Actor,
  storage: DocumentStorage,
): Promise<ConfirmResult> {
  const proyecto = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, documentPath: true },
  });

  if (!proyecto) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (!rutaPerteneceA(path, projectId)) {
    return { ok: false, reason: "WRONG_PATH" };
  }

  let bytes: Uint8Array;

  try {
    bytes = await storage.download(path);
  } catch {
    return { ok: false, reason: "MISSING_FILE" };
  }

  const validacion = validateDocument(bytes);

  if (!validacion.valid) {
    // Lo subido no sirve: se retira en lugar de dejarlo ocupando espacio.
    await storage.remove(path);
    return { ok: false, reasons: validacion.reasons };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      documentPath: path,
      documentSize: bytes.length,
      documentUploadedAt: new Date(),
    },
  });

  // El anterior se borra después de registrar el nuevo. Al revés, un fallo a
  // mitad dejaría al proyecto sin ningún documento.
  if (proyecto.documentPath && proyecto.documentPath !== path) {
    await storage.remove(proyecto.documentPath);
  }

  await registrar("PROJECT_DOCUMENT_ATTACHED", actor, projectId, {
    bytes: bytes.length,
  });

  return { ok: true };
}

export async function removeDocument(
  projectId: string,
  actor: Actor,
  storage: DocumentStorage,
): Promise<{ ok: true } | { ok: false; reason: "NOT_FOUND" }> {
  const proyecto = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, documentPath: true },
  });

  if (!proyecto) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (proyecto.documentPath) {
    await storage.remove(proyecto.documentPath);

    await prisma.project.update({
      where: { id: projectId },
      data: {
        documentPath: null,
        documentSize: null,
        documentUploadedAt: null,
      },
    });

    await registrar("PROJECT_DOCUMENT_REMOVED", actor, projectId);
  }

  return { ok: true };
}

export { MAX_DOCUMENT_BYTES };
