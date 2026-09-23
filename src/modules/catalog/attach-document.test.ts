import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  confirmUpload,
  prepareUpload,
  removeDocument,
  type DocumentStorage,
} from "@/modules/catalog/attach-document";
import { MAX_DOCUMENT_BYTES } from "@/modules/catalog/document";
import { createProject } from "@/modules/catalog/projects";

/** Almacenamiento de mentira: guarda en memoria y recuerda qué se borró. */
function almacenFalso() {
  const archivos = new Map<string, Uint8Array>();
  const borrados: string[] = [];

  const storage: DocumentStorage = {
    async createUploadUrl(path) {
      return { url: `https://falso.test/${path}`, token: "token-falso" };
    },
    async download(path) {
      const contenido = archivos.get(path);
      if (!contenido) throw new Error("no existe");
      return contenido;
    },
    async remove(path) {
      archivos.delete(path);
      borrados.push(path);
    },
  };

  return { storage, archivos, borrados };
}

function pdf(relleno = 50): Uint8Array {
  const cabecera = new TextEncoder().encode("%PDF-1.7\n");
  const salida = new Uint8Array(cabecera.length + relleno);
  salida.set(cabecera);
  return salida;
}

const PROYECTO = {
  title: "La huerta escolar",
  summary: "Bitácora de dos ciclos de siembra.",
  area: "Ciencias naturales",
  gradeLevel: 3,
  year: 2026,
  authors: [
    {
      givenNames: "Valentina",
      familyNames: "Torres Ruiz",
      fullNameAuthorized: false,
    },
  ],
};

async function limpiar() {
  await prisma.auditLog.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});
}

async function crearActorYProyecto(titulo = PROYECTO.title) {
  const usuario = await prisma.user.findFirst({}) ??
    (await prisma.user.create({
      data: {
        email: "docente@acervo.test",
        name: "Persona docente",
        passwordHash: "hash",
        role: "DOCENTE",
      },
    }));
  const actor = { id: usuario.id, role: "DOCENTE" as const };
  const creado = await createProject({ ...PROYECTO, title: titulo }, actor);
  if (!creado.ok) throw new Error("no se pudo crear el proyecto");
  return { actor, id: creado.id };
}

beforeEach(limpiar);
afterEach(limpiar);

describe("prepareUpload", () => {
  it("devuelve una ruta dentro de la carpeta del proyecto", async () => {
    const { id } = await crearActorYProyecto();
    const { storage } = almacenFalso();

    const r = await prepareUpload(id, storage);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.path.startsWith(`proyectos/${id}/`)).toBe(true);
  });

  it("responde NOT_FOUND si el proyecto no existe", async () => {
    const { storage } = almacenFalso();
    expect(await prepareUpload("inexistente", storage)).toEqual({
      ok: false,
      reason: "NOT_FOUND",
    });
  });
});

describe("confirmUpload", () => {
  it("registra la ruta, el tamaño y la fecha", async () => {
    const { actor, id } = await crearActorYProyecto();
    const { storage, archivos } = almacenFalso();
    const preparado = await prepareUpload(id, storage);
    if (!preparado.ok) throw new Error("no preparó");
    archivos.set(preparado.path, pdf(50));

    const r = await confirmUpload(id, preparado.path, actor, storage);

    expect(r.ok).toBe(true);
    const p = await prisma.project.findUnique({ where: { id } });
    expect(p?.documentPath).toBe(preparado.path);
    expect(p?.documentSize).toBe(59);
    expect(p?.documentUploadedAt).not.toBeNull();
  });

  it("rechaza una ruta que pertenece a otro proyecto", async () => {
    // Sin esta comprobación, quien controle el navegador podría apuntar el
    // documento de un proyecto al archivo de otro.
    const primero = await crearActorYProyecto("Primero");
    const segundo = await crearActorYProyecto("Segundo");
    const { storage, archivos } = almacenFalso();
    const ajeno = await prepareUpload(segundo.id, storage);
    if (!ajeno.ok) throw new Error("no preparó");
    archivos.set(ajeno.path, pdf());

    const r = await confirmUpload(primero.id, ajeno.path, primero.actor, storage);

    expect(r).toEqual({ ok: false, reason: "WRONG_PATH" });
  });

  it("rechaza una ruta inventada", async () => {
    const { actor, id } = await crearActorYProyecto();
    const { storage } = almacenFalso();

    const r = await confirmUpload(id, "../../secreto.pdf", actor, storage);

    expect(r).toEqual({ ok: false, reason: "WRONG_PATH" });
  });

  it("responde MISSING_FILE si no se llegó a subir nada", async () => {
    const { actor, id } = await crearActorYProyecto();
    const { storage } = almacenFalso();
    const preparado = await prepareUpload(id, storage);
    if (!preparado.ok) throw new Error("no preparó");

    const r = await confirmUpload(id, preparado.path, actor, storage);

    expect(r).toEqual({ ok: false, reason: "MISSING_FILE" });
  });

  it("rechaza y retira un archivo que no es PDF", async () => {
    const { actor, id } = await crearActorYProyecto();
    const { storage, archivos, borrados } = almacenFalso();
    const preparado = await prepareUpload(id, storage);
    if (!preparado.ok) throw new Error("no preparó");
    archivos.set(preparado.path, new TextEncoder().encode("no soy un pdf"));

    const r = await confirmUpload(id, preparado.path, actor, storage);

    expect(r.ok).toBe(false);
    expect(borrados).toContain(preparado.path);
    const p = await prisma.project.findUnique({ where: { id } });
    expect(p?.documentPath).toBeNull();
  });

  it("rechaza un archivo que supera el máximo", async () => {
    const { actor, id } = await crearActorYProyecto();
    const { storage, archivos } = almacenFalso();
    const preparado = await prepareUpload(id, storage);
    if (!preparado.ok) throw new Error("no preparó");
    archivos.set(preparado.path, pdf(MAX_DOCUMENT_BYTES));

    const r = await confirmUpload(id, preparado.path, actor, storage);

    expect(r.ok).toBe(false);
    if (!r.ok && "reasons" in r) expect(r.reasons).toContain("TOO_LARGE");
  });

  it("al reemplazar borra el documento anterior", async () => {
    const { actor, id } = await crearActorYProyecto();
    const { storage, archivos, borrados } = almacenFalso();

    const primera = await prepareUpload(id, storage);
    if (!primera.ok) throw new Error("no preparó");
    archivos.set(primera.path, pdf(10));
    await confirmUpload(id, primera.path, actor, storage);

    const segunda = await prepareUpload(id, storage);
    if (!segunda.ok) throw new Error("no preparó");
    archivos.set(segunda.path, pdf(20));
    await confirmUpload(id, segunda.path, actor, storage);

    expect(borrados).toContain(primera.path);
    const p = await prisma.project.findUnique({ where: { id } });
    expect(p?.documentPath).toBe(segunda.path);
  });

  it("deja registro en la auditoría", async () => {
    const { actor, id } = await crearActorYProyecto();
    const { storage, archivos } = almacenFalso();
    const preparado = await prepareUpload(id, storage);
    if (!preparado.ok) throw new Error("no preparó");
    archivos.set(preparado.path, pdf());

    await confirmUpload(id, preparado.path, actor, storage);

    const registro = await prisma.auditLog.findFirst({
      where: { action: "PROJECT_DOCUMENT_ATTACHED" },
    });
    expect(registro?.actorId).toBe(actor.id);
  });
});

describe("removeDocument", () => {
  it("borra el archivo y limpia los datos del proyecto", async () => {
    const { actor, id } = await crearActorYProyecto();
    const { storage, archivos } = almacenFalso();
    const preparado = await prepareUpload(id, storage);
    if (!preparado.ok) throw new Error("no preparó");
    archivos.set(preparado.path, pdf());
    await confirmUpload(id, preparado.path, actor, storage);

    const r = await removeDocument(id, actor, storage);

    expect(r.ok).toBe(true);
    expect(archivos.size).toBe(0);
    const p = await prisma.project.findUnique({ where: { id } });
    expect(p?.documentPath).toBeNull();
    expect(p?.documentSize).toBeNull();
  });

  it("no falla si el proyecto no tenía documento", async () => {
    const { actor, id } = await crearActorYProyecto();
    const { storage } = almacenFalso();

    expect((await removeDocument(id, actor, storage)).ok).toBe(true);
  });
});
