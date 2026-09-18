import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Protege el panel interno antes de que la página llegue a ejecutarse.
 *
 * Usa la configuración reducida, sin proveedores: el middleware no puede
 * cargar argon2 ni la base de datos. Le basta con verificar la firma de la
 * cookie de sesión.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/panel/:path*"],
};
