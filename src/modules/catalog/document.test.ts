import { describe, expect, it } from "vitest";
import {
  MAX_DOCUMENT_BYTES,
  documentPathFor,
  validateDocument,
} from "@/modules/catalog/document";

function pdf(relleno = 100): Uint8Array {
  const cabecera = new TextEncoder().encode("%PDF-1.7\n");
  const salida = new Uint8Array(cabecera.length + relleno);
  salida.set(cabecera);
  return salida;
}

function motivos(r: ReturnType<typeof validateDocument>) {
  return r.valid ? [] : r.reasons;
}

describe("validateDocument", () => {
  it("acepta un PDF de tamaño normal", () => {
    expect(validateDocument(pdf()).valid).toBe(true);
  });

  it("rechaza un archivo que no empieza como PDF", () => {
    const imagen = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    expect(motivos(validateDocument(imagen))).toContain("NOT_PDF");
  });

  it("rechaza un archivo renombrado a .pdf que no lo es", () => {
    // El navegador puede declarar application/pdf aunque el contenido sea otro:
    // por eso se miran los primeros bytes y no lo que dice el formulario.
    const texto = new TextEncoder().encode("Esto es un documento de Word");
    expect(motivos(validateDocument(texto))).toContain("NOT_PDF");
  });

  it("rechaza un archivo vacío", () => {
    expect(motivos(validateDocument(new Uint8Array(0)))).toContain("EMPTY");
  });

  it("acepta justo el tamaño máximo", () => {
    const cabecera = 9;
    expect(validateDocument(pdf(MAX_DOCUMENT_BYTES - cabecera)).valid).toBe(
      true,
    );
  });

  it("rechaza un byte por encima del máximo", () => {
    const cabecera = 9;
    expect(
      motivos(validateDocument(pdf(MAX_DOCUMENT_BYTES - cabecera + 1))),
    ).toContain("TOO_LARGE");
  });

  it("el máximo son 25 MB", () => {
    expect(MAX_DOCUMENT_BYTES).toBe(25 * 1024 * 1024);
  });
});

describe("documentPathFor", () => {
  it("guarda el archivo bajo la carpeta del proyecto", () => {
    expect(documentPathFor("abc123").startsWith("proyectos/abc123/")).toBe(
      true,
    );
  });

  it("termina en .pdf", () => {
    expect(documentPathFor("abc123").endsWith(".pdf")).toBe(true);
  });

  it("no repite el nombre entre dos cargas", () => {
    expect(documentPathFor("abc123")).not.toBe(documentPathFor("abc123"));
  });

  it("no contiene nada más que el identificador del proyecto", () => {
    // El nombre original del archivo se descarta: podría llevar dentro el
    // nombre completo de un estudiante.
    const ruta = documentPathFor("abc123");
    expect(ruta).toMatch(/^proyectos\/abc123\/[a-z0-9-]+\.pdf$/);
  });
});
