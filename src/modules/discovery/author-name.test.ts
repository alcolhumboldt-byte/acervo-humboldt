import { describe, expect, it } from "vitest";
import { displayAuthorName } from "@/modules/discovery/author-name";

describe("displayAuthorName", () => {
  it("muestra el nombre reducido cuando no hay autorización firmada", () => {
    const nombre = displayAuthorName({
      givenNames: "María Fernanda",
      familyNames: "Rodríguez Gómez",
      fullNameAuthorized: false,
    });

    expect(nombre).toBe("María R.");
  });

  it("nunca deja el apellido completo en el nombre reducido", () => {
    const nombre = displayAuthorName({
      givenNames: "María Fernanda",
      familyNames: "Rodríguez Gómez",
      fullNameAuthorized: false,
    });

    expect(nombre).not.toContain("Rodríguez");
    expect(nombre).not.toContain("Gómez");
  });

  it("omite el segundo nombre en la forma reducida", () => {
    const nombre = displayAuthorName({
      givenNames: "Juan Sebastián",
      familyNames: "Pérez",
      fullNameAuthorized: false,
    });

    expect(nombre).toBe("Juan P.");
  });

  it("muestra el nombre completo cuando hay autorización firmada", () => {
    const nombre = displayAuthorName({
      givenNames: "María Fernanda",
      familyNames: "Rodríguez Gómez",
      fullNameAuthorized: true,
    });

    expect(nombre).toBe("María Fernanda Rodríguez Gómez");
  });

  it("salta las partículas del apellido", () => {
    const nombre = displayAuthorName({
      givenNames: "Juan",
      familyNames: "de la Cruz",
      fullNameAuthorized: false,
    });

    expect(nombre).toBe("Juan C.");
  });

  it("reconoce las partículas escritas con mayúscula", () => {
    const nombre = displayAuthorName({
      givenNames: "Ana",
      familyNames: "Del Valle",
      fullNameAuthorized: false,
    });

    expect(nombre).toBe("Ana V.");
  });

  it("conserva la tilde en la inicial", () => {
    const nombre = displayAuthorName({
      givenNames: "Camilo",
      familyNames: "Álvarez",
      fullNameAuthorized: false,
    });

    expect(nombre).toBe("Camilo Á.");
  });

  it("tolera espacios sobrantes", () => {
    const nombre = displayAuthorName({
      givenNames: "  Laura   Sofía ",
      familyNames: "  Quesada  ",
      fullNameAuthorized: false,
    });

    expect(nombre).toBe("Laura Q.");
  });

  it("funciona cuando solo hay apellido de partículas", () => {
    const nombre = displayAuthorName({
      givenNames: "Pedro",
      familyNames: "de la",
      fullNameAuthorized: false,
    });

    expect(nombre).toBe("Pedro D.");
  });

  it("devuelve solo el nombre si no hay apellido registrado", () => {
    const nombre = displayAuthorName({
      givenNames: "Valentina",
      familyNames: "",
      fullNameAuthorized: false,
    });

    expect(nombre).toBe("Valentina");
  });
});
