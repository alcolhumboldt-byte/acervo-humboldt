import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/enums";

/**
 * Añade el rol del personal a los tipos de Auth.js, que por omisión solo
 * conoce nombre, correo e imagen.
 */
declare module "next-auth" {
  interface User {
    role?: Role;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

/**
 * La ampliación va sobre «@auth/core/jwt» y no sobre «next-auth/jwt»: el
 * segundo solo reexporta el tipo, y ampliar un reexporte no surte efecto.
 */
declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role;
  }
}
