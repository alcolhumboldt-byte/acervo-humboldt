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
const OPACIDAD = 0.13;

/** Qué parte de la diagonal ocupa la marca. Calcularlo contra la diagonal, y
 *  no contra el ancho, da un tamaño proporcionado tanto en hoja vertical como
 *  apaisada sin tener que distinguir los casos. */
const PROPORCION = 0.86;

export interface ColocacionMarca {
  size: number;
  x: number;
  y: number;
  gradosRotacion: number;
}

/**
 * Dónde y de qué tamaño va la marca en una página.
 *
 * Separado del dibujo para poder comprobar que cabe: una marca que se sale de
 * la hoja se recorta en silencio y nadie lo nota hasta que alguien abre un
 * documento apaisado.
 */
export function calcularColocacion(
  anchoPagina: number,
  altoPagina: number,
  anchoDelTextoATamanoUno: number,
): ColocacionMarca {
  const diagonal = Math.hypot(anchoPagina, altoPagina);
  const anguloRad = Math.atan2(altoPagina, anchoPagina);

  // El ancho del texto crece en proporción directa al tamaño, así que basta
  // medirlo una vez para despejar el tamaño buscado.
  const size = (diagonal * PROPORCION) / anchoDelTextoATamanoUno;
  const anchoTexto = anchoDelTextoATamanoUno * size;

  return {
    size,
    // Se centra restando medio texto desde el centro de la hoja, siguiendo la
    // dirección en que va escrito.
    x: anchoPagina / 2 - (anchoTexto / 2) * Math.cos(anguloRad),
    y: altoPagina / 2 - (anchoTexto / 2) * Math.sin(anguloRad),
    gradosRotacion: (anguloRad * 180) / Math.PI,
  };
}

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

  const anchoUnitario = fuente.widthOfTextAtSize(texto, 1);

  for (const pagina of documento.getPages()) {
    const { width, height } = pagina.getSize();
    const marca = calcularColocacion(width, height, anchoUnitario);

    // La marca corre de esquina a esquina: el ángulo sale de la propia hoja,
    // así que acompaña su forma en lugar de cruzarla siempre igual.
    pagina.drawText(texto, {
      x: marca.x,
      y: marca.y,
      size: marca.size,
      font: fuente,
      color: rgb(0.29, 0.16, 0.39),
      opacity: OPACIDAD,
      rotate: degrees(marca.gradosRotacion),
    });
  }

  return documento.save();
}
