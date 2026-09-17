import { describe, expect, it } from "vitest";
import {
  ARGON2_PARAMS,
  hashPassword,
  verifyPassword,
} from "@/modules/identity/password-hashing";

const CONTRASENA = "Tiple-Bambuco-47!";

describe("hashPassword", () => {
  it("produce un hash argon2id", async () => {
    const hash = await hashPassword(CONTRASENA);
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });

  it("deja los parámetros de coste escritos en el hash", async () => {
    const hash = await hashPassword(CONTRASENA);
    const { memoryCost, timeCost, parallelism } = ARGON2_PARAMS;
    expect(hash).toContain(`m=${memoryCost},t=${timeCost},p=${parallelism}`);
  });

  it("nunca deja la contraseña en claro dentro del hash", async () => {
    const hash = await hashPassword(CONTRASENA);
    expect(hash).not.toContain(CONTRASENA);
  });

  it("genera hashes distintos para la misma contraseña", async () => {
    const [uno, dos] = await Promise.all([
      hashPassword(CONTRASENA),
      hashPassword(CONTRASENA),
    ]);
    expect(uno).not.toBe(dos);
  });
});

describe("verifyPassword", () => {
  it("acepta la contraseña correcta", async () => {
    const hash = await hashPassword(CONTRASENA);
    await expect(verifyPassword(hash, CONTRASENA)).resolves.toBe(true);
  });

  it("rechaza una contraseña incorrecta", async () => {
    const hash = await hashPassword(CONTRASENA);
    await expect(verifyPassword(hash, "Marimba-Chirimia-93!")).resolves.toBe(
      false,
    );
  });

  it("distingue mayúsculas y minúsculas", async () => {
    const hash = await hashPassword(CONTRASENA);
    await expect(verifyPassword(hash, CONTRASENA.toLowerCase())).resolves.toBe(
      false,
    );
  });

  it("devuelve falso ante un hash corrupto en vez de lanzar un error", async () => {
    await expect(verifyPassword("esto-no-es-un-hash", CONTRASENA)).resolves.toBe(
      false,
    );
  });

  it("devuelve falso ante un hash vacío", async () => {
    await expect(verifyPassword("", CONTRASENA)).resolves.toBe(false);
  });
});
