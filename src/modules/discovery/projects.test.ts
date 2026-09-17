import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  gradeLabel,
  getPublishedProject,
  listPublishedProjects,
} from "@/modules/discovery/projects";

async function crearProyecto(
  slug: string,
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED",
  publishedAt: Date | null,
) {
  return prisma.project.create({
    data: {
      slug,
      title: `Proyecto ${slug}`,
      summary: "Resumen de prueba.",
      area: "Ciencias naturales",
      gradeLevel: 9,
      year: 2026,
      status,
      publishedAt,
      authors: {
        create: {
          givenNames: "María Fernanda",
          familyNames: "Rodríguez Gómez",
          fullNameAuthorized: false,
        },
      },
    },
  });
}

async function limpiar() {
  await prisma.project.deleteMany({});
}

beforeEach(limpiar);
afterEach(limpiar);

describe("listPublishedProjects", () => {
  it("devuelve los proyectos publicados", async () => {
    await crearProyecto("uno", "PUBLISHED", new Date());

    const proyectos = await listPublishedProjects();

    expect(proyectos).toHaveLength(1);
  });

  it("no devuelve borradores", async () => {
    await crearProyecto("borrador", "DRAFT", null);

    expect(await listPublishedProjects()).toHaveLength(0);
  });

  it("no devuelve proyectos en revisión", async () => {
    await crearProyecto("revision", "REVIEW", null);

    expect(await listPublishedProjects()).toHaveLength(0);
  });

  it("no devuelve proyectos archivados", async () => {
    await crearProyecto("archivado", "ARCHIVED", new Date());

    expect(await listPublishedProjects()).toHaveLength(0);
  });

  it("muestra los autores con el nombre reducido", async () => {
    await crearProyecto("uno", "PUBLISHED", new Date());

    const [proyecto] = await listPublishedProjects();

    expect(proyecto?.authors).toEqual(["María R."]);
  });

  it("no expone el apellido completo en ningún campo", async () => {
    await crearProyecto("uno", "PUBLISHED", new Date());

    const proyectos = await listPublishedProjects();

    expect(JSON.stringify(proyectos)).not.toContain("Rodríguez");
  });

  it("ordena del más reciente al más antiguo", async () => {
    await crearProyecto("viejo", "PUBLISHED", new Date("2024-01-01"));
    await crearProyecto("nuevo", "PUBLISHED", new Date("2026-01-01"));

    const proyectos = await listPublishedProjects();

    expect(proyectos.map((p) => p.slug)).toEqual(["nuevo", "viejo"]);
  });

  it("respeta el límite pedido", async () => {
    await crearProyecto("uno", "PUBLISHED", new Date("2026-01-01"));
    await crearProyecto("dos", "PUBLISHED", new Date("2025-01-01"));

    expect(await listPublishedProjects({ limit: 1 })).toHaveLength(1);
  });
});

describe("gradeLabel", () => {
  it("nombra el preescolar", () => {
    expect(gradeLabel(0)).toBe("Preescolar");
  });

  it("nombra los grados en palabras", () => {
    expect(gradeLabel(1)).toBe("Primero");
    expect(gradeLabel(9)).toBe("Noveno");
    expect(gradeLabel(11)).toBe("Once");
  });

  it("devuelve un texto neutro ante un grado fuera de rango", () => {
    expect(gradeLabel(42)).toBe("Sin grado");
  });
});

describe("getPublishedProject", () => {
  it("devuelve el proyecto publicado que corresponde al slug", async () => {
    await crearProyecto("uno", "PUBLISHED", new Date());

    const proyecto = await getPublishedProject("uno");

    expect(proyecto?.title).toBe("Proyecto uno");
  });

  it("devuelve null cuando el slug no existe", async () => {
    expect(await getPublishedProject("no-existe")).toBeNull();
  });

  it("devuelve null para un borrador, aunque el slug sea correcto", async () => {
    await crearProyecto("borrador", "DRAFT", null);

    expect(await getPublishedProject("borrador")).toBeNull();
  });

  it("devuelve null para un proyecto en revisión", async () => {
    await crearProyecto("revision", "REVIEW", null);

    expect(await getPublishedProject("revision")).toBeNull();
  });

  it("devuelve null para un proyecto archivado", async () => {
    await crearProyecto("archivado", "ARCHIVED", new Date());

    expect(await getPublishedProject("archivado")).toBeNull();
  });

  it("muestra los autores con el nombre reducido", async () => {
    await crearProyecto("uno", "PUBLISHED", new Date());

    const proyecto = await getPublishedProject("uno");

    expect(proyecto?.authors).toEqual(["María R."]);
  });

  it("no expone el apellido completo", async () => {
    await crearProyecto("uno", "PUBLISHED", new Date());

    const proyecto = await getPublishedProject("uno");

    expect(JSON.stringify(proyecto)).not.toContain("Rodríguez");
  });
});
