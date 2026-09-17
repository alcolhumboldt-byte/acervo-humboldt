import { existsSync } from "node:fs";
import { config } from "dotenv";

// Los tests corren contra .env.test, nunca contra .env.
config({ path: existsSync(".env.test") ? ".env.test" : ".env" });

const url = process.env.DATABASE_URL ?? "";

// Salvaguarda: los tests borran filas. Si apuntaran a la base de desarrollo
// destruirían datos reales, así que se niegan a arrancar.
if (!url.includes("acervo_test")) {
  throw new Error(
    "Los tests solo pueden correr contra la base 'acervo_test'. " +
      "Revisa DATABASE_URL en .env.test",
  );
}
