/**
 * Política de contraseñas del personal.
 *
 * Va más allá de exigir longitud: rechaza además repeticiones, secuencias de
 * teclado y contraseñas construidas con los datos de la propia persona, que
 * son los tres patrones que más aparecen cuando alguien elige una contraseña
 * a la carrera.
 */

export type PasswordIssue =
  | "TOO_SHORT"
  | "TOO_LONG"
  | "REPEATED_CHARACTERS"
  | "SEQUENTIAL_CHARACTERS"
  | "CONTAINS_PERSONAL_DATA";

export interface PersonalData {
  email?: string;
  name?: string;
}

export type PasswordPolicyResult =
  | { valid: true }
  | { valid: false; reasons: PasswordIssue[] };

export const MIN_LENGTH = 12;

/** Tope defensivo: argon2 cifra cualquier longitud, pero no hace falta pagar
 *  el coste de una entrada arbitrariamente grande. */
export const MAX_LENGTH = 128;

/** Máximo de caracteres idénticos seguidos permitidos. */
const MAX_REPEATED = 2;

/** Longitud a partir de la cual un tramo se considera secuencia. Con 3 se
 *  rechazarían palabras corrientes del español como «defensa». */
const SEQUENCE_LENGTH = 4;

/** Fragmentos de datos personales más cortos que esto se ignoran: preposiciones
 *  como «de» aparecen en cualquier contraseña por azar. */
const MIN_PERSONAL_TOKEN = 3;

const SEQUENCE_SOURCES = [
  "abcdefghijklmnopqrstuvwxyz",
  "0123456789",
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
];

export const PASSWORD_ISSUE_MESSAGES: Record<PasswordIssue, string> = {
  TOO_SHORT: `La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`,
  TOO_LONG: `La contraseña no puede superar los ${MAX_LENGTH} caracteres.`,
  REPEATED_CHARACTERS:
    "La contraseña no puede repetir el mismo carácter tres veces seguidas.",
  SEQUENTIAL_CHARACTERS:
    "La contraseña no puede contener secuencias como «1234», «abcd» o «qwerty».",
  CONTAINS_PERSONAL_DATA:
    "La contraseña no puede contener tu nombre ni tu correo.",
};

/** Pasa a minúsculas y quita tildes, para que «Gómez» y «gomez» se comparen igual. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function hasRepeatedCharacters(password: string): boolean {
  return new RegExp(`(.)\\1{${MAX_REPEATED},}`).test(password);
}

function hasSequence(normalized: string): boolean {
  for (const source of SEQUENCE_SOURCES) {
    for (let i = 0; i + SEQUENCE_LENGTH <= source.length; i += 1) {
      const fragment = source.slice(i, i + SEQUENCE_LENGTH);
      const reversed = [...fragment].reverse().join("");

      if (normalized.includes(fragment) || normalized.includes(reversed)) {
        return true;
      }
    }
  }

  return false;
}

function personalTokens({ email, name }: PersonalData): string[] {
  const raw: string[] = [];

  if (email) {
    const localPart = email.split("@")[0] ?? "";
    raw.push(localPart, ...localPart.split(/[^\p{L}\p{N}]+/u));
  }

  if (name) {
    raw.push(...name.split(/\s+/));
  }

  return raw
    .map(normalize)
    .filter((token) => token.length >= MIN_PERSONAL_TOKEN);
}

export function validatePassword(
  password: string,
  personalData: PersonalData = {},
): PasswordPolicyResult {
  const normalized = normalize(password);
  const reasons = new Set<PasswordIssue>();

  if (password.length < MIN_LENGTH) {
    reasons.add("TOO_SHORT");
  }

  if (password.length > MAX_LENGTH) {
    reasons.add("TOO_LONG");
  }

  if (hasRepeatedCharacters(password)) {
    reasons.add("REPEATED_CHARACTERS");
  }

  if (hasSequence(normalized)) {
    reasons.add("SEQUENTIAL_CHARACTERS");
  }

  if (personalTokens(personalData).some((token) => normalized.includes(token))) {
    reasons.add("CONTAINS_PERSONAL_DATA");
  }

  return reasons.size === 0
    ? { valid: true }
    : { valid: false, reasons: [...reasons] };
}
