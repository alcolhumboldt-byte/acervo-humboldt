import { prisma } from "@/lib/prisma";
import {
  MAX_DOCUMENT_BYTES,
  documentPathFor,
  validateDocument,
  type DocumentIssue,
} from "@/modules/catalog/document";
import type { Actor } from "@/modules/catalog/projects";
import { buildPreview } from "@/modules/catalog/preview";
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
  /**
   * Enlace de lectura que caduca solo. Nunca se guarda ni se publica.
   *
   * Con `descargarComo` el navegador guarda el archivo en lugar de abrirlo, y
   * con el nombre que se indique: el nombre real del archivo es un
   * identificador sin significado, y conviene que lo descargado se reconozca.
   */
  createSignedUrl(
    path: string,
    segundos: number,
    descargarComo?: string,
  ): Promise<string>;
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

/** La vista previa vive junto al documento, con el mismo nombre y un sufijo.
 *  Así borrar un proyecto o un documento arrastra siempre a las dos. */
function rutaDeVista(documento: string): string {
  return documento.replace(/\.pdf$/, "-vista.pdf");
}

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

  // La vista previa se saca del archivo ya marcado, así que hereda la marca.
  const rutaVista = rutaDeVista(path);
  await storage.replace(rutaVista, await buildPreview(marcado));

  await prisma.project.update({
    where: { id: projectId },
    data: {
      documentPath: path,
      documentSize: marcado.length,
      documentUploadedAt: new Date(),
      previewPath: rutaVista,
    },
  });

  // El anterior se borra después de registrar el nuevo. Al revés, un fallo a
  // mitad dejaría al proyecto sin ningún documento.
  if (proyecto.documentPath && proyecto.documentPath !== path) {
    await storage.remove(proyecto.documentPath);
    await storage.remove(rutaDeVista(proyecto.documentPath));
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
  paraDescargar = false,
): Promise<{ ok: true; url: string } | { ok: false; reason: "NOT_FOUND" }> {
  const proyecto = await prisma.project.findUnique({
    where: { id: projectId },
    select: { documentPath: true, slug: true },
  });

  if (!proyecto?.documentPath) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  return {
    ok: true,
    url: await storage.createSignedUrl(
      proyecto.documentPath,
      SEGUNDOS_DE_VISTA,
      // El nombre visible sale de la dirección del proyecto, nunca del archivo
      // original ni de los autores: lo descargado circula y no debe llevar
      // dentro el nombre de un estudiante.
      paraDescargar ? `${proyecto.slug}.pdf` : undefined,
    ),
  };
}

/** Cuánto dura el enlace de la vista previa pública. */
export const SEGUNDOS_DE_VISTA_PUBLICA = 600;

/**
 * Enlace a la primera página, para la ficha pública de un proyecto.
 *
 * Filtra por estado PUBLISHED dentro de la consulta. Sin ese filtro, conocer
 * la dirección de un borrador bastaría para asomarse a su contenido, que es
 * justo lo que el ciclo de aprobación existe para impedir.
 */
export async function publicPreviewUrl(
  slug: string,
  storage: DocumentStorage,
): Promise<string | null> {
  const proyecto = await prisma.project.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { previewPath: true },
  });

  if (!proyecto?.previewPath) {
    return null;
  }

  return storage.createSignedUrl(
    proyecto.previewPath,
    SEGUNDOS_DE_VISTA_PUBLICA,
  );
}

export async function removeDocument(
  projectId: string,
  actor: Actor,
  storage: DocumentStorage,
): Promise<{ ok: true } | { ok: false; reason: "NOT_FOUND" }> {
  const proyecto = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, documentPath: true, previewPath: true },
  });

  if (!proyecto) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (proyecto.documentPath) {
    await storage.remove(proyecto.documentPath);

    if (proyecto.previewPath) {
      await storage.remove(proyecto.previewPath);
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        documentPath: null,
        documentSize: null,
        documentUploadedAt: null,
        previewPath: null,
      },
    });

    await registrar("PROJECT_DOCUMENT_REMOVED", actor, projectId);
  }

  return { ok: true };
}

export { MAX_DOCUMENT_BYTES };
