import { prisma } from "@/lib/prisma";
import {
  MAX_DOCUMENT_BYTES,
  documentPathFor,
  validateDocument,
  type DocumentIssue,
} from "@/modules/catalog/document";
import type { Actor } from "@/modules/catalog/projects";
import { applyWatermark } from "@/modules/catalog/watermark";
import { INSTITUCION } from "@/config/institucion";

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
  /** Sobrescribe lo que haya en esa ruta. */
  replace(path: string, bytes: Uint8Array): Promise<void>;
  /** Enlace de lectura que caduca solo. Nunca se guarda ni se publica. */
  createSignedUrl(path: string, segundos: number): Promise<string>;
  remove(path: string): Promise<void>;
}

export type PrepareResult =
  | { ok: true; path: string; url: string; token: string }
  | { ok: false; reason: "NOT_FOUND" };

export type ConfirmResult =
  | { ok: true }
  | {
      ok: false;
      reason: "NOT_FOUND" | "WRONG_PATH" | "MISSING_FILE" | "CANNOT_WATERMARK";
    }
  | { ok: false; reasons: DocumentIssue[] };

/** Lo que queda estampado en cada página de cada documento guardado. */
export const TEXTO_MARCA = `${INSTITUCION.nombre} · uso restringido`;

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

  // Se marca antes de darlo por bueno, de modo que no exista en el
  // almacenamiento ni un instante una copia sin marcar que alguien pudiera
  // llegar a entregar.
  let marcado: Uint8Array;

  try {
    marcado = await applyWatermark(bytes, TEXTO_MARCA);
  } catch {
    await storage.remove(path);
    return { ok: false, reason: "CANNOT_WATERMARK" };
  }

  await storage.replace(path, marcado);

  await prisma.project.update({
    where: { id: projectId },
    data: {
      documentPath: path,
      documentSize: marcado.length,
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

/**
 * Enlace temporal para que el personal vea el documento desde el panel.
 *
 * Caduca solo y no se guarda en ninguna parte: cada vez que alguien quiere
 * mirarlo se pide uno nuevo. Esto es para el panel, no para el público: la
 * entrega al público pasa por solicitud aprobada.
 */
export const SEGUNDOS_DE_VISTA = 120;

export async function documentViewUrl(
  projectId: string,
  storage: DocumentStorage,
): Promise<{ ok: true; url: string } | { ok: false; reason: "NOT_FOUND" }> {
  const proyecto = await prisma.project.findUnique({
    where: { id: projectId },
    select: { documentPath: true },
  });

  if (!proyecto?.documentPath) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  return {
    ok: true,
    url: await storage.createSignedUrl(proyecto.documentPath, SEGUNDOS_DE_VISTA),
  };
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
