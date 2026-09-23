import { randomUUID } from "node:crypto";

/**
 * Comprobaciones del documento PDF de un proyecto.
 *
 * Son deliberadamente desconfiadas: el tipo que declara el navegador al subir
 * un archivo lo elige quien sube, no el archivo, así que aquí se miran los
 * bytes reales.
 */

/** Tope acordado para el proyecto. */
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

/** Todo PDF empieza por estos cinco bytes: «%PDF-». */
const FIRMA_PDF = [0x25, 0x50, 0x44, 0x46, 0x2d];

export type DocumentIssue = "EMPTY" | "NOT_PDF" | "TOO_LARGE";

export type DocumentValidation =
  | { valid: true }
  | { valid: false; reasons: DocumentIssue[] };

export const DOCUMENT_MESSAGES: Record<DocumentIssue, string> = {
  EMPTY: "El archivo está vacío.",
  NOT_PDF: "El archivo debe ser un PDF.",
  TOO_LARGE: "El PDF no puede superar los 25 MB.",
};

function empiezaComoPdf(bytes: Uint8Array): boolean {
  return FIRMA_PDF.every((byte, i) => bytes[i] === byte);
}

export function validateDocument(bytes: Uint8Array): DocumentValidation {
  const reasons: DocumentIssue[] = [];

  if (bytes.length === 0) {
    return { valid: false, reasons: ["EMPTY"] };
  }

  if (!empiezaComoPdf(bytes)) {
    reasons.push("NOT_PDF");
  }

  if (bytes.length > MAX_DOCUMENT_BYTES) {
    reasons.push("TOO_LARGE");
  }

  return reasons.length === 0 ? { valid: true } : { valid: false, reasons };
}

/**
 * Nombre con el que se guarda el archivo.
 *
 * El nombre original se descarta: «proyecto-maria-rodriguez.pdf» llevaría
 * dentro el nombre completo de una estudiante, y esa ruta acabaría en enlaces
 * y registros. El identificador aleatorio además evita que alguien adivine la
 * ruta de un documento ajeno.
 */
export function documentPathFor(projectId: string): string {
  return `proyectos/${projectId}/${randomUUID()}.pdf`;
}
