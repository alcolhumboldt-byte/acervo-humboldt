import { describe, expect, it } from "vitest";
import { slugify, uniqueSlug } from "@/modules/catalog/slug";

describe("slugify", () => {
  it("pasa el título a minúsculas separadas por guiones", () => {
    expect(slugify("La huerta escolar")).toBe("la-huerta-escolar");
  });

  it("quita las tildes", () => {
    expect(slugify("Geometría escondida")).toBe("geometria-escondida");
  });

  it("convierte la eñe en ene", () => {
    expect(slugify("El sueño de los niños")).toBe("el-sueno-de-los-ninos");
  });

  it("descarta los signos de puntuación", () => {
    expect(slugify("¿Qué comen? ¡Averígualo!")).toBe("que-comen-averigualo");
  });

  it("colapsa espacios y guiones repetidos", () => {
    expect(slugify("Agua   --  y  vida")).toBe("agua-y-vida");
  });

  it("no deja guiones al principio ni al final", () => {
    expect(slugify("  ¡Vamos!  ")).toBe("vamos");
  });

  it("conserva los números", () => {
    expect(slugify("Proyecto 2026 fase 2")).toBe("proyecto-2026-fase-2");
  });

  it("devuelve cadena vacía si no queda nada utilizable", () => {
    expect(slugify("¿¡!?")).toBe("");
  });
});

describe("uniqueSlug", () => {
  it("devuelve el original cuando está libre", async () => {
    const libre = await uniqueSlug("huerta", async () => false);
    expect(libre).toBe("huerta");
  });

  it("añade un número cuando ya está ocupado", async () => {
    const ocupados = new Set(["huerta"]);
    const nuevo = await uniqueSlug("huerta", async (s) => ocupados.has(s));
    expect(nuevo).toBe("huerta-2");
  });

  it("sigue subiendo mientras siga ocupado", async () => {
    const ocupados = new Set(["huerta", "huerta-2", "huerta-3"]);
    const nuevo = await uniqueSlug("huerta", async (s) => ocupados.has(s));
    expect(nuevo).toBe("huerta-4");
  });

  it("usa un texto de respaldo cuando el título no deja nada", async () => {
    const nuevo = await uniqueSlug("", async () => false);
    expect(nuevo).toBe("proyecto");
  });
});
