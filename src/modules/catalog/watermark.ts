import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

/**
 * Estampa una marca de agua en todas las páginas del documento.
 *
 * El objetivo no es impedir la copia —eso no lo consigue ninguna marca— sino
 * que cualquier hoja que circule suelta siga diciendo de dónde salió y que su
 * uso está restringido.
 *
 * Se marca cada página y no solo la primera: lo que se comparte por mensajería
 * suele ser una captura o una hoja arrancada del conjunto.
 */

/** Tenue: tiene que leerse sin tapar el trabajo del estudiante. */
const OPACIDAD = 0.14;

export async function applyWatermark(
  bytes: Uint8Array,
  texto: string,
): Promise<Uint8Array> {
  let documento: PDFDocument;

  try {
    documento = await PDFDocument.load(bytes, { ignoreEncryption: false });
  } catch (error) {
    throw new Error(
      "no se pudo leer el PDF para marcarlo: " +
        (error instanceof Error ? error.message : "formato no reconocido"),
    );
  }

  const fuente = await documento.embedFont(StandardFonts.Helvetica);

  for (const pagina of documento.getPages()) {
    const { width, height } = pagina.getSize();

    // El tamaño se calcula desde el ancho para que la marca ocupe un espacio
    // parecido tanto en una hoja vertical como en una apaisada.
    const tamano = Math.max(12, width / (texto.length * 0.52));
    const ancho = fuente.widthOfTextAtSize(texto, tamano);

    pagina.drawText(texto, {
      x: (width - ancho * 0.82) / 2,
      y: height / 2 - ancho * 0.28,
      size: tamano,
      font: fuente,
      color: rgb(0.29, 0.16, 0.39),
      opacity: OPACIDAD,
      rotate: degrees(35),
    });
  }

  return documento.save();
}
