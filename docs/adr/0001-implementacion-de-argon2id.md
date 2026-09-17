# ADR 0001 — Implementación de argon2id

Fecha: 2026-09-17
Estado: aceptada

## Contexto

El módulo `identity` cifra las contraseñas del personal con argon2id. En el
ecosistema de Node hay dos implementaciones de uso extendido:

- `argon2`: enlace nativo construido con node-gyp.
- `@node-rs/argon2`: enlace nativo construido con napi-rs.

El proyecto usa npm 12, que bloquea por defecto los scripts de instalación de
las dependencias. Es una defensa frente a ataques de cadena de suministro, y
conviene conservarla en un proyecto que custodia datos de menores de edad.

`argon2` declara un script de instalación (`node-gyp-build`). Con el bloqueo
activo la instalación falla, y al autorizarla puede terminar compilando desde
código fuente si no encuentra un binario previo para la plataforma. Eso hace
que la instalación dependa de que cada máquina tenga instaladas herramientas
de compilación de C.

`@node-rs/argon2` no declara scripts de instalación. Publica los binarios ya
compilados como dependencias opcionales por plataforma, entre ellas
`darwin-arm64` (equipo de desarrollo actual), `linux-x64-gnu` (despliegue
previsible) y `win32-x64-msvc` (equipo Windows anterior).

## Decisión

Se usa `@node-rs/argon2`.

## Consecuencias

- La instalación no requiere herramientas de compilación ni autorizar scripts.
- El proyecto conserva el bloqueo de scripts de instalación por defecto.
- La API difiere de la de `argon2`: al consultar documentación o ejemplos hay
  que verificar a cuál de las dos librerías corresponden.
- Los parámetros de coste de argon2id se fijan de forma explícita en el código
  y no se delegan a los valores por omisión de la librería, para que un cambio
  de versión no los altere en silencio.
- El enum `Algorithm` que declara la librería no es utilizable: TypeScript lo
  publica como `const enum` ambiente, que `isolatedModules` prohíbe leer, y en
  tiempo de ejecución el objeto llega vacío, de modo que `Algorithm.Argon2id`
  vale `undefined`. Se pasa el número directamente (argon2id = 2), verificado
  contra el prefijo del hash resultante.
