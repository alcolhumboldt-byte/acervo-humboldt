import { PDFDocument } from "pdf-lib";

/**
 * Vista previa pública: la primera página del documento, nada más.
 *
 * Se construye a partir del PDF ya marcado, así que la vista hereda la marca
 * de agua sin volver a estamparla.
 *
 * La limitación a una página es el fundamento de todo el flujo de solicitud.
 * Publicar el documento entero y poner al lado un botón de «solicitar» sería
 * un adorno: el visor de cualquier navegador deja guardar lo que muestra, y la
 * solicitud no protegería nada.
 */
export async function buildPreview(marcado: Uint8Array): Promise<Uint8Array> {
  let origen: PDFDocument;

  try {
    origen = await PDFDocument.load(marcado);
  } catch (error) {
    throw new Error(
      "no se pudo leer el PDF para la vista previa: " +
        (error instanceof Error ? error.message : "formato no reconocido"),
    );
  }

  // Defensa ante un PDF malformado. No se puede provocar desde los tests:
  // pdf-lib devuelve siempre al menos una página al recargar un documento.
  if (origen.getPageCount() === 0) {
    throw new Error("el documento está sin páginas");
  }

  const vista = await PDFDocument.create();
  const [primera] = await vista.copyPages(origen, [0]);

  if (primera) {
    vista.addPage(primera);
  }

  return vista.save();
}
