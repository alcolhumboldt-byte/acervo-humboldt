import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { authenticate } from "@/modules/identity/authenticate";

/**
 * Sesión del personal.
 *
 * Este archivo sí carga el cifrado y la base de datos, así que solo puede
 * usarse desde el servidor de la aplicación, nunca desde el middleware.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },

      async authorize(credenciales) {
        const email =
          typeof credenciales.email === "string" ? credenciales.email : "";
        const password =
          typeof credenciales.password === "string"
            ? credenciales.password
            : "";

        if (!email || !password) {
          return null;
        }

        const resultado = await authenticate(email, password);

        // Devolver null hace que Auth.js responda con un error genérico. Es lo
        // que queremos: el motivo real queda en la auditoría, no en pantalla.
        if (!resultado.ok) {
          return null;
        }

        return {
          id: resultado.user.id,
          email: resultado.user.email,
          name: resultado.user.name,
          role: resultado.user.role,
        };
      },
    }),
  ],
});
