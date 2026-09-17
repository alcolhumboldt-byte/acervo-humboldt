# Acervo

Repositorio web institucional del **Colegio Alejandro de Humboldt** (Sogamoso,
Boyacá, Colombia). Preserva y divulga los proyectos académicos y los
reconocimientos destacados de sus estudiantes, de preescolar a grado once.

Consta de un portal público para consultar las fichas de los proyectos y un
panel interno para docentes y administradores.

Proyecto de grado de Andrés Felipe Leal Alarcón, docente de la institución.

> **Estado:** en desarrollo. El portal público funciona; el panel interno y el
> flujo de solicitud de documentos todavía no están construidos.

## Protección de datos

Todos los autores son menores de edad, así que esto no es un añadido sino el
eje del diseño:

- **Nombres reducidos por defecto.** El portal muestra el primer nombre y la
  inicial del primer apellido. El nombre completo solo aparece si un
  administrador registra que la familia firmó la autorización correspondiente
  (Ley 1581 de 2012).
- **La conversión ocurre en la capa de datos.** El nombre completo de un
  estudiante no llega a la capa de presentación, ni siquiera para descartarlo
  allí.
- **Los borradores responden 404**, igual que una dirección inexistente, para
  que no se puedan descubrir probando direcciones.
- **Las descargas requieren aprobación.** Ningún PDF se sirve desde un
  almacenamiento público.
- **Toda acción administrativa queda registrada** en una bitácora de auditoría
  que no guarda datos personales de estudiantes.

Los estudiantes que aparecen en los datos de ejemplo son inventados.

## Requisitos

- Node.js 22.22.2 o superior (hay un `.nvmrc`: basta con `nvm use`)
- npm 12 o superior
- PostgreSQL 16

## Puesta en marcha

```bash
npm install
cp .env.example .env          # y completar DATABASE_URL
createdb acervo_dev
npx prisma migrate dev
npm run dev
```

Para crear la primera cuenta de administrador:

```bash
SEED_ADMIN_EMAIL="correo@ejemplo.com" npm run db:seed
```

Si no se entrega `SEED_ADMIN_PASSWORD`, el script genera una contraseña segura
y la muestra una sola vez.

Para cargar proyectos de ejemplo durante el desarrollo:

```bash
npm run db:ejemplos
```

## Tests

Los tests de integración usan su propia base de datos y se niegan a ejecutarse
contra cualquier otra.

```bash
createdb acervo_test
cp .env.example .env.test     # y apuntar DATABASE_URL a acervo_test
npx prisma migrate deploy
npm test
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run lint` | Revisión de estilo de código |
| `npm run typecheck` | Verificación de tipos |
| `npm test` | Tests unitarios y de integración |
| `npm run db:seed` | Crea la cuenta de administrador |
| `npm run db:ejemplos` | Carga proyectos de ejemplo (solo desarrollo) |

Tras cambiar el esquema de la base de datos hay que reiniciar `npm run dev`:
el cliente de Prisma queda en memoria y no se refresca solo.

## Stack

Next.js 16 (App Router) · TypeScript estricto · Tailwind CSS 4 · PostgreSQL 16
con Prisma 7 · argon2id · Vitest

Las decisiones de arquitectura relevantes se registran en [`docs/adr`](docs/adr).
