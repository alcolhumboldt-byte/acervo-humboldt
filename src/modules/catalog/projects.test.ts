import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  allowedTransitions,
  changeStatus,
  createProject,
  updateProject,
  validateProject,
} from "@/modules/catalog/projects";
import { listPublishedProjects } from "@/modules/discovery/projects";

const VALIDO = {
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

async function crearActor(role: "ADMIN" | "DOCENTE") {
  const usuario = await prisma.user.create({
    data: {
      email: `${role.toLowerCase()}@acervo.test`,
      name: `Persona ${role}`,
      passwordHash: "hash",
      role,
    },
  });
  return { id: usuario.id, role };
}

beforeEach(limpiar);
afterEach(limpiar);

describe("validateProject", () => {
  it("acepta un proyecto completo", () => {
    expect(validateProject(VALIDO).valid).toBe(true);
  });

  it("exige título", () => {
    const r = validateProject({ ...VALIDO, title: "   " });
    expect(r.valid ? [] : r.reasons).toContain("TITLE_REQUIRED");
  });

  it("exige resumen", () => {
    const r = validateProject({ ...VALIDO, summary: "" });
    expect(r.valid ? [] : r.reasons).toContain("SUMMARY_REQUIRED");
  });

  it("exige área", () => {
    const r = validateProject({ ...VALIDO, area: "" });
    expect(r.valid ? [] : r.reasons).toContain("AREA_REQUIRED");
  });

  it("rechaza un grado fuera de preescolar a once", () => {
    expect(
      validateProject({ ...VALIDO, gradeLevel: 12 }).valid ? [] : ["x"],
    ).toHaveLength(1);
    const r = validateProject({ ...VALIDO, gradeLevel: -1 });
    expect(r.valid ? [] : r.reasons).toContain("GRADE_OUT_OF_RANGE");
  });

  it("rechaza un año disparatado", () => {
    const r = validateProject({ ...VALIDO, year: 1800 });
    expect(r.valid ? [] : r.reasons).toContain("YEAR_OUT_OF_RANGE");
  });

  it("exige al menos un autor", () => {
    const r = validateProject({ ...VALIDO, authors: [] });
    expect(r.valid ? [] : r.reasons).toContain("AUTHORS_REQUIRED");
  });

  it("exige nombre y apellido en cada autor", () => {
    const r = validateProject({
      ...VALIDO,
      authors: [{ givenNames: "Ana", familyNames: "", fullNameAuthorized: false }],
    });
    expect(r.valid ? [] : r.reasons).toContain("AUTHOR_NAME_REQUIRED");
  });
});

describe("createProject", () => {
  it("crea el proyecto en borrador", async () => {
    const actor = await crearActor("DOCENTE");
    const r = await createProject(VALIDO, actor);

    expect(r.ok).toBe(true);
    const creado = await prisma.project.findFirst({});
    expect(creado?.status).toBe("DRAFT");
    expect(creado?.publishedAt).toBeNull();
  });

  it("deriva la dirección del título", async () => {
    const actor = await crearActor("DOCENTE");
    await createProject(VALIDO, actor);

    const creado = await prisma.project.findFirst({});
    expect(creado?.slug).toBe("la-huerta-escolar");
  });

  it("evita repetir la dirección de otro proyecto", async () => {
    const actor = await crearActor("DOCENTE");
    await createProject(VALIDO, actor);
    await createProject(VALIDO, actor);

    const slugs = (await prisma.project.findMany({})).map((p) => p.slug).sort();
    expect(slugs).toEqual(["la-huerta-escolar", "la-huerta-escolar-2"]);
  });

  it("guarda el texto de búsqueda sin tildes", async () => {
    const actor = await crearActor("DOCENTE");
    await createProject({ ...VALIDO, title: "Geometría" }, actor);

    const creado = await prisma.project.findFirst({});
    expect(creado?.searchText).toContain("geometria");
  });

  it("guarda los autores", async () => {
    const actor = await crearActor("DOCENTE");
    await createProject(VALIDO, actor);

    const autores = await prisma.author.findMany({});
    expect(autores).toHaveLength(1);
    expect(autores[0]?.familyNames).toBe("Torres Ruiz");
  });

  it("deja registro en la auditoría", async () => {
    const actor = await crearActor("DOCENTE");
    await createProject(VALIDO, actor);

    const registro = await prisma.auditLog.findFirst({
      where: { action: "PROJECT_CREATED" },
    });
    expect(registro?.actorId).toBe(actor.id);
  });

  it("no guarda nombres de estudiantes en la auditoría", async () => {
    const actor = await crearActor("DOCENTE");
    await createProject(VALIDO, actor);

    const registros = await prisma.auditLog.findMany({});
    expect(JSON.stringify(registros)).not.toContain("Torres");
  });

  it("no crea nada si los datos no son válidos", async () => {
    const actor = await crearActor("DOCENTE");
    const r = await createProject({ ...VALIDO, title: "" }, actor);

    expect(r.ok).toBe(false);
    expect(await prisma.project.count({})).toBe(0);
  });
});

describe("changeStatus", () => {
  async function crearBorrador(actor: { id: string; role: "ADMIN" | "DOCENTE" }) {
    const r = await createProject(VALIDO, actor);
    if (!r.ok) throw new Error("no se pudo crear");
    return r.id;
  }

  it("un docente puede enviar a revisión", async () => {
    const actor = await crearActor("DOCENTE");
    const id = await crearBorrador(actor);

    expect((await changeStatus(id, "REVIEW", actor)).ok).toBe(true);
  });

  it("un docente NO puede publicar", async () => {
    const actor = await crearActor("DOCENTE");
    const id = await crearBorrador(actor);
    await changeStatus(id, "REVIEW", actor);

    const r = await changeStatus(id, "PUBLISHED", actor);

    expect(r).toEqual({ ok: false, reason: "NOT_ALLOWED" });
  });

  it("un administrador sí puede publicar", async () => {
    const admin = await crearActor("ADMIN");
    const id = await crearBorrador(admin);
    await changeStatus(id, "REVIEW", admin);

    expect((await changeStatus(id, "PUBLISHED", admin)).ok).toBe(true);
  });

  it("al publicar registra la fecha", async () => {
    const admin = await crearActor("ADMIN");
    const id = await crearBorrador(admin);
    await changeStatus(id, "REVIEW", admin);
    await changeStatus(id, "PUBLISHED", admin);

    const p = await prisma.project.findUnique({ where: { id } });
    expect(p?.publishedAt).not.toBeNull();
  });

  it("publicar lo hace visible en el portal público", async () => {
    const admin = await crearActor("ADMIN");
    const id = await crearBorrador(admin);
    await changeStatus(id, "REVIEW", admin);
    await changeStatus(id, "PUBLISHED", admin);

    const publicos = await listPublishedProjects();
    expect(publicos.map((p) => p.slug)).toContain("la-huerta-escolar");
  });

  it("rechaza saltarse la revisión", async () => {
    const admin = await crearActor("ADMIN");
    const id = await crearBorrador(admin);

    const r = await changeStatus(id, "PUBLISHED", admin);

    expect(r).toEqual({ ok: false, reason: "INVALID_TRANSITION" });
  });

  it("deja registro del cambio con el estado anterior y el nuevo", async () => {
    const actor = await crearActor("DOCENTE");
    const id = await crearBorrador(actor);
    await changeStatus(id, "REVIEW", actor);

    const registro = await prisma.auditLog.findFirst({
      where: { action: "PROJECT_STATUS_CHANGED" },
    });
    expect(registro?.metadata).toMatchObject({ from: "DRAFT", to: "REVIEW" });
  });

  it("responde NOT_FOUND si el proyecto no existe", async () => {
    const admin = await crearActor("ADMIN");
    const r = await changeStatus("inexistente", "REVIEW", admin);
    expect(r).toEqual({ ok: false, reason: "NOT_FOUND" });
  });
});

describe("updateProject", () => {
  it("cambia los datos y rehace el texto de búsqueda", async () => {
    const actor = await crearActor("DOCENTE");
    const creado = await createProject(VALIDO, actor);
    if (!creado.ok) throw new Error("no se pudo crear");

    await updateProject(
      creado.id,
      { ...VALIDO, title: "Geometría aplicada" },
      actor,
    );

    const p = await prisma.project.findUnique({ where: { id: creado.id } });
    expect(p?.title).toBe("Geometría aplicada");
    expect(p?.searchText).toContain("geometria");
  });

  it("no cambia la dirección aunque cambie el título", async () => {
    // Cambiarla rompería los enlaces que ya se hayan compartido.
    const actor = await crearActor("DOCENTE");
    const creado = await createProject(VALIDO, actor);
    if (!creado.ok) throw new Error("no se pudo crear");

    await updateProject(creado.id, { ...VALIDO, title: "Otro título" }, actor);

    const p = await prisma.project.findUnique({ where: { id: creado.id } });
    expect(p?.slug).toBe("la-huerta-escolar");
  });

  it("reemplaza la lista de autores", async () => {
    const actor = await crearActor("DOCENTE");
    const creado = await createProject(VALIDO, actor);
    if (!creado.ok) throw new Error("no se pudo crear");

    await updateProject(
      creado.id,
      {
        ...VALIDO,
        authors: [
          {
            givenNames: "Diego",
            familyNames: "Nieto Vargas",
            fullNameAuthorized: true,
          },
        ],
      },
      actor,
    );

    const autores = await prisma.author.findMany({});
    expect(autores).toHaveLength(1);
    expect(autores[0]?.fullNameAuthorized).toBe(true);
  });
});

describe("allowedTransitions", () => {
  it("un docente en borrador solo puede enviar a revisión", () => {
    expect(allowedTransitions("DRAFT", "DOCENTE")).toEqual(["REVIEW"]);
  });

  it("un docente en revisión no puede publicar", () => {
    expect(allowedTransitions("REVIEW", "DOCENTE")).not.toContain("PUBLISHED");
  });

  it("un administrador en revisión puede publicar o devolver", () => {
    expect(allowedTransitions("REVIEW", "ADMIN").sort()).toEqual([
      "DRAFT",
      "PUBLISHED",
    ]);
  });

  it("un docente no puede tocar un proyecto publicado", () => {
    expect(allowedTransitions("PUBLISHED", "DOCENTE")).toEqual([]);
  });

  it("un administrador puede recuperar un archivado", () => {
    expect(allowedTransitions("ARCHIVED", "ADMIN")).toEqual(["PUBLISHED"]);
  });
});
