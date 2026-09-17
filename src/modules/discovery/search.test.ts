import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  PAGE_SIZE,
  getFilterOptions,
  searchPublishedProjects,
} from "@/modules/discovery/projects";
import { buildSearchText } from "@/modules/discovery/search-text";

interface Datos {
  slug: string;
  title?: string;
  summary?: string;
  area?: string;
  gradeLevel?: number;
  year?: number;
  status?: "DRAFT" | "PUBLISHED";
}

async function crear({
  slug,
  title = "Proyecto de prueba",
  summary = "Resumen cualquiera.",
  area = "Ciencias naturales",
  gradeLevel = 9,
  year = 2026,
  status = "PUBLISHED",
}: Datos) {
  return prisma.project.create({
    data: {
      slug,
      title,
      summary,
      area,
      gradeLevel,
      year,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      searchText: buildSearchText({ title, summary, area }),
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

describe("searchPublishedProjects", () => {
  it("devuelve todos los publicados cuando no hay filtros", async () => {
    await crear({ slug: "uno" });
    await crear({ slug: "dos" });

    const { projects, total } = await searchPublishedProjects({});

    expect(projects).toHaveLength(2);
    expect(total).toBe(2);
  });

  it("no incluye borradores", async () => {
    await crear({ slug: "publicado" });
    await crear({ slug: "borrador", status: "DRAFT" });

    const { total } = await searchPublishedProjects({});

    expect(total).toBe(1);
  });

  it("filtra por área", async () => {
    await crear({ slug: "uno", area: "Matemáticas" });
    await crear({ slug: "dos", area: "Ciencias sociales" });

    const { projects } = await searchPublishedProjects({ area: "Matemáticas" });

    expect(projects.map((p) => p.slug)).toEqual(["uno"]);
  });

  it("filtra por grado", async () => {
    await crear({ slug: "uno", gradeLevel: 3 });
    await crear({ slug: "dos", gradeLevel: 11 });

    const { projects } = await searchPublishedProjects({ gradeLevel: 11 });

    expect(projects.map((p) => p.slug)).toEqual(["dos"]);
  });

  it("filtra por año", async () => {
    await crear({ slug: "uno", year: 2024 });
    await crear({ slug: "dos", year: 2026 });

    const { projects } = await searchPublishedProjects({ year: 2024 });

    expect(projects.map((p) => p.slug)).toEqual(["uno"]);
  });

  it("combina varios filtros a la vez", async () => {
    await crear({ slug: "uno", area: "Matemáticas", year: 2026 });
    await crear({ slug: "dos", area: "Matemáticas", year: 2024 });

    const { projects } = await searchPublishedProjects({
      area: "Matemáticas",
      year: 2024,
    });

    expect(projects.map((p) => p.slug)).toEqual(["dos"]);
  });

  it("busca en el título", async () => {
    await crear({ slug: "uno", title: "Los humedales del valle" });
    await crear({ slug: "dos", title: "Robots de reciclaje" });

    const { projects } = await searchPublishedProjects({ query: "humedales" });

    expect(projects.map((p) => p.slug)).toEqual(["uno"]);
  });

  it("busca también en el resumen", async () => {
    await crear({ slug: "uno", summary: "Estudio sobre las mariposas." });

    const { total } = await searchPublishedProjects({ query: "mariposas" });

    expect(total).toBe(1);
  });

  it("encuentra aunque se escriba sin tildes", async () => {
    await crear({ slug: "uno", title: "Geometría escondida" });

    const { total } = await searchPublishedProjects({ query: "geometria" });

    expect(total).toBe(1);
  });

  it("encuentra aunque se escriba con tildes de más", async () => {
    await crear({ slug: "uno", title: "La huerta escolar" });

    const { total } = await searchPublishedProjects({ query: "huérta" });

    expect(total).toBe(1);
  });

  it("ignora mayúsculas en la búsqueda", async () => {
    await crear({ slug: "uno", title: "Los humedales" });

    const { total } = await searchPublishedProjects({ query: "HUMEDALES" });

    expect(total).toBe(1);
  });

  it("devuelve vacío cuando nada coincide", async () => {
    await crear({ slug: "uno" });

    const { projects, total } = await searchPublishedProjects({
      query: "dinosaurios",
    });

    expect(projects).toHaveLength(0);
    expect(total).toBe(0);
  });

  it("parte los resultados en páginas", async () => {
    for (let i = 0; i < PAGE_SIZE + 3; i += 1) {
      await crear({ slug: `p-${i}` });
    }

    const primera = await searchPublishedProjects({});
    const segunda = await searchPublishedProjects({ page: 2 });

    expect(primera.projects).toHaveLength(PAGE_SIZE);
    expect(segunda.projects).toHaveLength(3);
    expect(primera.pageCount).toBe(2);
    expect(primera.total).toBe(PAGE_SIZE + 3);
  });

  it("no repite proyectos entre páginas", async () => {
    for (let i = 0; i < PAGE_SIZE + 3; i += 1) {
      await crear({ slug: `p-${i}` });
    }

    const primera = await searchPublishedProjects({});
    const segunda = await searchPublishedProjects({ page: 2 });
    const slugs = [...primera.projects, ...segunda.projects].map((p) => p.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("trata una página fuera de rango como la primera", async () => {
    await crear({ slug: "uno" });

    const { page, projects } = await searchPublishedProjects({ page: 0 });

    expect(page).toBe(1);
    expect(projects).toHaveLength(1);
  });

  it("sigue sin exponer apellidos completos", async () => {
    await crear({ slug: "uno" });

    const resultado = await searchPublishedProjects({});

    expect(JSON.stringify(resultado)).not.toContain("Rodríguez");
  });
});

describe("getFilterOptions", () => {
  it("lista las áreas de los proyectos publicados", async () => {
    await crear({ slug: "uno", area: "Matemáticas" });
    await crear({ slug: "dos", area: "Artes" });

    const { areas } = await getFilterOptions();

    expect(areas).toEqual(["Artes", "Matemáticas"]);
  });

  it("no lista valores que solo existen en borradores", async () => {
    await crear({ slug: "uno", area: "Matemáticas" });
    await crear({ slug: "dos", area: "Secreta", status: "DRAFT" });

    const { areas } = await getFilterOptions();

    expect(areas).not.toContain("Secreta");
  });

  it("lista los años del más reciente al más antiguo", async () => {
    await crear({ slug: "uno", year: 2024 });
    await crear({ slug: "dos", year: 2026 });

    const { years } = await getFilterOptions();

    expect(years).toEqual([2026, 2024]);
  });

  it("lista los grados en orden ascendente y sin repetir", async () => {
    await crear({ slug: "uno", gradeLevel: 11 });
    await crear({ slug: "dos", gradeLevel: 3 });
    await crear({ slug: "tres", gradeLevel: 3 });

    const { grades } = await getFilterOptions();

    expect(grades).toEqual([3, 11]);
  });
});
