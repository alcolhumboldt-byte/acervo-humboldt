import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getArchiveStats } from "@/modules/discovery/projects";

async function crear(
  slug: string,
  year: number,
  area: string,
  status: "DRAFT" | "PUBLISHED" = "PUBLISHED",
) {
  return prisma.project.create({
    data: {
      slug,
      title: "Proyecto",
      summary: "Resumen.",
      area,
      gradeLevel: 9,
      year,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });
}

beforeEach(async () => {
  await prisma.project.deleteMany({});
});
afterEach(async () => {
  await prisma.project.deleteMany({});
});

describe("getArchiveStats", () => {
  it("cuenta solo los proyectos publicados", async () => {
    await crear("uno", 2026, "Matemáticas");
    await crear("dos", 2026, "Artes", "DRAFT");

    expect((await getArchiveStats()).projectCount).toBe(1);
  });

  it("cuenta las áreas distintas", async () => {
    await crear("uno", 2026, "Matemáticas");
    await crear("dos", 2026, "Matemáticas");
    await crear("tres", 2026, "Artes");

    expect((await getArchiveStats()).areaCount).toBe(2);
  });

  it("devuelve el primer y el último año del archivo", async () => {
    await crear("uno", 2024, "Matemáticas");
    await crear("dos", 2026, "Artes");

    const { firstYear, lastYear } = await getArchiveStats();

    expect(firstYear).toBe(2024);
    expect(lastYear).toBe(2026);
  });

  it("devuelve ceros y años nulos con el archivo vacío", async () => {
    const stats = await getArchiveStats();

    expect(stats.projectCount).toBe(0);
    expect(stats.areaCount).toBe(0);
    expect(stats.firstYear).toBeNull();
    expect(stats.lastYear).toBeNull();
  });
});
