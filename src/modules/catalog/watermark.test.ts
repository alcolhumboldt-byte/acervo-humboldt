import { PDFDocument, PDFName } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { applyWatermark } from "@/modules/catalog/watermark";

/** PDF real con páginas en blanco: así, todo lo que aparezca dibujado
 *  después viene de la marca de agua y de nada más. */
async function pdfDePrueba(paginas = 1): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  for (let i = 0; i < paginas; i += 1) {
    doc.addPage([595, 842]);
  }

  return doc.save();
}

/** Bytes dibujados en cada página. Es lo que crece al estampar la marca. */
async function contenidoPorPagina(bytes: Uint8Array): Promise<number[]> {
  const doc = await PDFDocument.load(bytes);

  return doc.getPages().map((pagina) => {
    const ref = pagina.node.get(PDFName.of("Contents"));
    const objeto = doc.context.lookup(ref) as {
      contents?: Uint8Array;
      asArray?: () => unknown[];
    };

    const flujos = objeto?.contents
      ? [objeto]
      : ((objeto?.asArray?.() ?? []).map((r) =>
          doc.context.lookup(r as Parameters<typeof doc.context.lookup>[0]),
        ) as { contents?: Uint8Array }[]);

    return flujos.reduce((total, f) => total + (f?.contents?.length ?? 0), 0);
  });
}

const MARCA = "Colegio Alejandro de Humboldt · uso restringido";

describe("applyWatermark", () => {
  it("devuelve un PDF válido", async () => {
    const salida = await applyWatermark(await pdfDePrueba(), MARCA);
    const cabecera = new TextDecoder().decode(salida.slice(0, 5));

    expect(cabecera).toBe("%PDF-");
  });

  it("conserva el número de páginas", async () => {
    const salida = await applyWatermark(await pdfDePrueba(3), MARCA);
    const leido = await PDFDocument.load(salida);

    expect(leido.getPageCount()).toBe(3);
  });

  it("conserva el tamaño de la página", async () => {
    const salida = await applyWatermark(await pdfDePrueba(), MARCA);
    const leido = await PDFDocument.load(salida);
    const { width, height } = leido.getPage(0).getSize();

    expect(Math.round(width)).toBe(595);
    expect(Math.round(height)).toBe(842);
  });

  it("modifica el archivo", async () => {
    const original = await pdfDePrueba();
    const salida = await applyWatermark(original, MARCA);

    expect(salida.length).not.toBe(original.length);
  });

  it("dibuja algo donde antes no había nada", async () => {
    const original = await pdfDePrueba();

    expect(await contenidoPorPagina(original)).toEqual([0]);
    expect((await contenidoPorPagina(await applyWatermark(original, MARCA)))[0])
      .toBeGreaterThan(0);
  });

  it("marca todas las páginas, no solo la primera", async () => {
    // Lo que circula por mensajería suele ser una hoja suelta, no el conjunto.
    const salida = await applyWatermark(await pdfDePrueba(4), MARCA);
    const porPagina = await contenidoPorPagina(salida);

    expect(porPagina).toHaveLength(4);
    expect(porPagina.every((bytes) => bytes > 0)).toBe(true);
  });

  it("falla con un mensaje claro si el archivo no es un PDF legible", async () => {
    const basura = new TextEncoder().encode("esto no es un pdf");

    await expect(applyWatermark(basura, MARCA)).rejects.toThrow(
      /no se pudo leer/i,
    );
  });
});
