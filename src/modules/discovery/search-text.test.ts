import { describe, expect, it } from "vitest";
import {
  buildSearchText,
  normalizeForSearch,
} from "@/modules/discovery/search-text";

describe("normalizeForSearch", () => {
  it("quita las tildes", () => {
    expect(normalizeForSearch("Geometría")).toBe("geometria");
  });

  it("convierte la eñe en ene", () => {
    expect(normalizeForSearch("Niñez")).toBe("ninez");
  });

  it("pasa todo a minúsculas", () => {
    expect(normalizeForSearch("HUMEDALES")).toBe("humedales");
  });

  it("colapsa los espacios repetidos", () => {
    expect(normalizeForSearch("  la   huerta  ")).toBe("la huerta");
  });
});

describe("buildSearchText", () => {
  it("junta título, resumen y área", () => {
    const texto = buildSearchText({
      title: "Geometría escondida",
      summary: "Análisis de fachadas",
      area: "Matemáticas",
    });

    expect(texto).toBe("geometria escondida analisis de fachadas matematicas");
  });
});
