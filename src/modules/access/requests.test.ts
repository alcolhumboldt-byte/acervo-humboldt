import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createDocumentRequest,
  validateRequest,
} from "@/modules/access/requests";

const VALIDA = {
  requesterName: "Marta Villamizar",
  requesterEmail: "marta@ejemplo.com",
  reason: "Soy docente de otra institución y quiero citar el trabajo.",
};

async function limpiar() {
  await prisma.documentRequest.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.project.deleteMany({});
}

async function crearProyecto({
  publicado = true,
  conDocumento = true,
} = {}) {
  return prisma.project.create({
    data: {
      slug: "la-huerta-escolar",
      title: "La huerta escolar",
      summary: "Resumen.",
      area: "Ciencias naturales",
      gradeLevel: 3,
      year: 2026,
      status: publicado ? "PUBLISHED" : "DRAFT",
      publishedAt: publicado ? new Date() : null,
      documentPath: conDocumento ? "proyectos/x/y.pdf" : null,
    },
  });
}

beforeEach(limpiar);
afterEach(limpiar);

describe("validateRequest", () => {
  it("acepta una solicitud completa", () => {
    expect(validateRequest(VALIDA).valid).toBe(true);
  });

  it("exige nombre", () => {
    const r = validateRequest({ ...VALIDA, requesterName: "  " });
    expect(r.valid ? [] : r.reasons).toContain("NAME_REQUIRED");
  });

  it("exige correo", () => {
    const r = validateRequest({ ...VALIDA, requesterEmail: "" });
    expect(r.valid ? [] : r.reasons).toContain("EMAIL_REQUIRED");
  });

  it("rechaza un correo con forma inválida", () => {
    const r = validateRequest({ ...VALIDA, requesterEmail: "marta.ejemplo" });
    expect(r.valid ? [] : r.reasons).toContain("EMAIL_INVALID");
  });

  it("exige un motivo", () => {
    const r = validateRequest({ ...VALIDA, reason: "" });
    expect(r.valid ? [] : r.reasons).toContain("REASON_REQUIRED");
  });

  it("rechaza un motivo demasiado breve para decidir sobre él", () => {
    const r = validateRequest({ ...VALIDA, reason: "porque sí" });
    expect(r.valid ? [] : r.reasons).toContain("REASON_TOO_SHORT");
  });
});

describe("createDocumentRequest", () => {
  it("guarda la solicitud en espera", async () => {
    const proyecto = await crearProyecto();

    const r = await createDocumentRequest(proyecto.slug, VALIDA);

    expect(r.ok).toBe(true);
    const guardada = await prisma.documentRequest.findFirst({});
    expect(guardada?.status).toBe("PENDING");
    expect(guardada?.requesterEmail).toBe("marta@ejemplo.com");
  });

  it("normaliza el correo a minúsculas", async () => {
    const proyecto = await crearProyecto();

    await createDocumentRequest(proyecto.slug, {
      ...VALIDA,
      requesterEmail: "  Marta@Ejemplo.COM ",
    });

    const guardada = await prisma.documentRequest.findFirst({});
    expect(guardada?.requesterEmail).toBe("marta@ejemplo.com");
  });

  it("no se puede solicitar el documento de un borrador", async () => {
    // Aceptarla revelaría que ese proyecto existe antes de publicarse.
    await crearProyecto({ publicado: false });

    const r = await createDocumentRequest("la-huerta-escolar", VALIDA);

    expect(r).toEqual({ ok: false, reason: "NOT_FOUND" });
    expect(await prisma.documentRequest.count({})).toBe(0);
  });

  it("no se puede solicitar un documento que no existe", async () => {
    await crearProyecto({ conDocumento: false });

    const r = await createDocumentRequest("la-huerta-escolar", VALIDA);

    expect(r).toEqual({ ok: false, reason: "NO_DOCUMENT" });
  });

  it("responde NOT_FOUND ante una dirección inventada", async () => {
    expect(await createDocumentRequest("no-existe", VALIDA)).toEqual({
      ok: false,
      reason: "NOT_FOUND",
    });
  });

  it("no guarda nada si los datos no son válidos", async () => {
    const proyecto = await crearProyecto();

    const r = await createDocumentRequest(proyecto.slug, {
      ...VALIDA,
      requesterEmail: "roto",
    });

    expect(r.ok).toBe(false);
    expect(await prisma.documentRequest.count({})).toBe(0);
  });

  it("deja registro en la auditoría sin guardar el correo de quien pide", async () => {
    const proyecto = await crearProyecto();

    await createDocumentRequest(proyecto.slug, VALIDA);

    const registro = await prisma.auditLog.findFirst({
      where: { action: "DOCUMENT_REQUESTED" },
    });
    expect(registro).not.toBeNull();
    expect(JSON.stringify(registro)).not.toContain("marta@ejemplo.com");
  });
});
