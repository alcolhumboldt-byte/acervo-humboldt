"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export interface EstadoIngreso {
  error?: string;
}

/**
 * Un único mensaje para todos los fallos posibles.
 *
 * Distinguir «contraseña incorrecta» de «cuenta bloqueada» o «cuenta
 * desactivada» le diría a quien prueba al azar cuáles correos corresponden a
 * personal del colegio. El motivo real queda en la auditoría.
 */
const MENSAJE_GENERICO =
  "No pudimos verificar esos datos. Revisa tu correo y tu contraseña.";

export async function ingresar(
  _anterior: EstadoIngreso,
  datos: FormData,
): Promise<EstadoIngreso> {
  const email = String(datos.get("email") ?? "");
  const password = String(datos.get("password") ?? "");

  if (!email || !password) {
    return { error: "Escribe tu correo y tu contraseña." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/panel" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: MENSAJE_GENERICO };
    }

    // Un ingreso correcto termina lanzando la redirección de Next. No es un
    // fallo: hay que dejarla pasar para que el navegador vaya al panel.
    throw error;
  }

  return {};
}
