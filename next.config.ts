import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Ancla la raíz de Turbopack a este proyecto. Sin esto, Next infiere la raíz
// desde un package-lock.json suelto en el directorio personal del usuario.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
