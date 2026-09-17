import { describe, expect, it } from "vitest";
import {
  PASSWORD_ISSUE_MESSAGES,
  validatePassword,
  type PasswordIssue,
} from "@/modules/identity/password-policy";

const FUERTE = "Tiple-Bambuco-47!";

function motivos(resultado: ReturnType<typeof validatePassword>): PasswordIssue[] {
  return resultado.valid ? [] : resultado.reasons;
}

describe("validatePassword", () => {
  it("acepta una contraseña fuerte", () => {
    expect(validatePassword(FUERTE).valid).toBe(true);
  });

  it("rechaza contraseñas de menos de 12 caracteres", () => {
    expect(motivos(validatePassword("Corta-1!"))).toContain("TOO_SHORT");
  });

  it("rechaza contraseñas excesivamente largas", () => {
    expect(motivos(validatePassword("A".repeat(200)))).toContain("TOO_LONG");
  });

  it("rechaza tres o más caracteres idénticos seguidos", () => {
    expect(motivos(validatePassword("Tiplee-Bammmbuco!"))).toContain(
      "REPEATED_CHARACTERS",
    );
  });

  it("rechaza secuencias de teclado", () => {
    expect(motivos(validatePassword("Bambuco-qwerty!"))).toContain(
      "SEQUENTIAL_CHARACTERS",
    );
  });

  it("rechaza secuencias numéricas", () => {
    expect(motivos(validatePassword("Bambuco-12345!"))).toContain(
      "SEQUENTIAL_CHARACTERS",
    );
  });

  it("rechaza secuencias alfabéticas", () => {
    expect(motivos(validatePassword("Bambuco-defgh!"))).toContain(
      "SEQUENTIAL_CHARACTERS",
    );
  });

  it("rechaza una secuencia escrita al revés", () => {
    expect(motivos(validatePassword("Bambuco-54321!"))).toContain(
      "SEQUENTIAL_CHARACTERS",
    );
  });

  it("rechaza contraseñas que contienen el correo del usuario", () => {
    const resultado = validatePassword("acordeon-vallenato!", {
      email: "acordeon@colegio.edu.co",
    });
    expect(motivos(resultado)).toContain("CONTAINS_PERSONAL_DATA");
  });

  it("rechaza contraseñas que contienen el nombre del usuario", () => {
    const resultado = validatePassword("Marimba-Quesada-9!", {
      name: "Laura Quesada",
    });
    expect(motivos(resultado)).toContain("CONTAINS_PERSONAL_DATA");
  });

  it("compara los datos personales sin distinguir mayúsculas ni tildes", () => {
    const resultado = validatePassword("Marimba-gomez-94!", {
      name: "Andrés Gómez",
    });
    expect(motivos(resultado)).toContain("CONTAINS_PERSONAL_DATA");
  });

  it("ignora fragmentos de datos personales demasiado cortos", () => {
    // "de" no debe descalificar la contraseña por aparecer en cualquier parte.
    const resultado = validatePassword(FUERTE, { name: "Ana de Paz" });
    expect(resultado.valid).toBe(true);
  });

  it("acumula todos los motivos aplicables", () => {
    const resultado = motivos(validatePassword("aaa1234"));
    expect(resultado).toContain("TOO_SHORT");
    expect(resultado).toContain("REPEATED_CHARACTERS");
    expect(resultado).toContain("SEQUENTIAL_CHARACTERS");
  });

  it("no repite el mismo motivo dos veces", () => {
    const resultado = motivos(validatePassword("abcdefghijklm"));
    const unicos = new Set(resultado);
    expect(unicos.size).toBe(resultado.length);
  });

  it("tiene un mensaje en español para cada motivo posible", () => {
    const todos: PasswordIssue[] = [
      "TOO_SHORT",
      "TOO_LONG",
      "REPEATED_CHARACTERS",
      "SEQUENTIAL_CHARACTERS",
      "CONTAINS_PERSONAL_DATA",
    ];
    for (const motivo of todos) {
      expect(PASSWORD_ISSUE_MESSAGES[motivo]).toBeTruthy();
    }
  });
});
