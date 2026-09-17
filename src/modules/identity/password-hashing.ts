import { hash, verify } from "@node-rs/argon2";

/**
 * Cifrado de contraseñas con argon2id.
 *
 * Los parámetros de coste se fijan aquí de forma explícita, y no se dejan a
 * los valores por omisión de la librería, para que una actualización no los
 * cambie sin que nadie se entere. Corresponden a la configuración mínima que
 * recomienda OWASP para argon2id.
 */

/**
 * Identificador de argon2id.
 *
 * Se escribe el número en vez de usar el enum `Algorithm` de la librería por
 * dos razones: está declarado como `const enum` ambiente, que TypeScript
 * prohíbe leer con `isolatedModules` activo —y Next lo exige—, y además el
 * objeto llega vacío en tiempo de ejecución, así que `Algorithm.Argon2id`
 * valdría `undefined`. El test comprueba que el hash producido sea argon2id.
 */
const ARGON2ID = 2;

export const ARGON2_PARAMS = {
  algorithm: ARGON2ID,
  /** 19 MiB por hilo. */
  memoryCost: 19456,
  /** Número de pasadas. */
  timeCost: 2,
  parallelism: 1,
  /** Longitud del hash en bytes. */
  outputLen: 32,
} as const;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_PARAMS);
}

/**
 * Compara una contraseña contra su hash.
 *
 * Un hash ilegible se trata como contraseña incorrecta en lugar de propagar el
 * error: quien intenta ingresar no debe distinguir «no coincide» de «el dato
 * guardado está corrupto».
 */
export async function verifyPassword(
  storedHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(storedHash, password, ARGON2_PARAMS);
  } catch {
    return false;
  }
}
