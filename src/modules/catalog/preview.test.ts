import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { buildPreview } from "@/modules/catalog/preview";

async function pdfDePrueba(paginas: number, ancho = 595, alto = 842) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < paginas; i += 1) doc.addPage([ancho, alto]);
  return doc.save();
}

describe("buildPreview", () => {
  it("deja una sola página de un documento largo", async () => {
    const vista = await buildPreview(await pdfDePrueba(12));
    const doc = await PDFDocument.load(vista);

    expect(doc.getPageCount()).toBe(1);
  });

  it("funciona con un documento de una sola página", async () => {
    const vista = await buildPreview(await pdfDePrueba(1));
    const doc = await PDFDocument.load(vista);

    expect(doc.getPageCount()).toBe(1);
  });

  it("conserva el tamaño original de la página", async () => {
    const vista = await buildPreview(await pdfDePrueba(3, 842, 595));
    const doc = await PDFDocument.load(vista);
    const { width, height } = doc.getPage(0).getSize();

    expect(Math.round(width)).toBe(842);
    expect(Math.round(height)).toBe(595);
  });

  it("pesa menos que el documento completo", async () => {
    const completo = await pdfDePrueba(30);
    const vista = await buildPreview(completo);

    expect(vista.length).toBeLessThan(completo.length);
  });

  it("falla con un mensaje claro si no se puede leer", async () => {
    const basura = new TextEncoder().encode("no soy un pdf");

    await expect(buildPreview(basura)).rejects.toThrow(/no se pudo leer/i);
  });
});
