import type { NextAuthConfig } from "next-auth";

/**
 * Configuración que también corre en el middleware.
 *
 * Va separada del archivo `auth.ts` a propósito: el middleware se ejecuta en
 * un entorno restringido, antes que la página, y no puede cargar el cifrado
 * argon2 ni el cliente de base de datos. Aquí solo hay reglas y rutas; el
 * proveedor de credenciales, que sí necesita ambos, se añade aparte.
 */
export const authConfig = {
  pages: {
    signIn: "/ingresar",
  },

  session: {
    // Obligatorio con credenciales propias: la sesión viaja firmada en una
    // cookie en lugar de guardarse en la base de datos.
    strategy: "jwt",
  },

  callbacks: {
    /** Decide si una petición puede continuar. El middleware la usa. */
    authorized({ auth, request }) {
      const esPanel = request.nextUrl.pathname.startsWith("/panel");
      return esPanel ? Boolean(auth?.user) : true;
    },

    /** El rol viaja dentro del testigo firmado para no consultar la base en
     *  cada petición. */
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },

    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      if (token.role) {
        session.user.role = token.role;
      }
      return session;
    },
  },

  providers: [],
} satisfies NextAuthConfig;
