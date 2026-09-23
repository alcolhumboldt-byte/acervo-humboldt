# ADR 0002 — Permanecer en el plan gratuito de Supabase

Fecha: 2026-09-23
Estado: aceptada

## Contexto

Acervo guarda sus datos en Supabase. El plan gratuito ofrece 500 MB de base de
datos, 1 GB de almacenamiento de archivos y 5 GB de transferencia mensual. El
plan Pro cuesta 25 dólares al mes y sube esos límites a 8 GB y 100 GB.

Ninguno de esos límites aprieta hoy. Los registros son texto y ocupan unos
pocos kilobytes por proyecto. Con el tope de 25 MB por PDF, 1 GB da para unos
cuarenta proyectos en el peor caso y entre ciento veinticinco y quinientos con
documentos de tamaño corriente.

El límite que sí importa no es de tamaño:

> Free projects are paused after 1 week of inactivity.

Un proyecto gratuito se suspende tras una semana sin actividad, y el sitio deja
de responder hasta que alguien lo reactiva a mano desde el panel de Supabase.

En un colegio eso no es hipotético: vacaciones de mitad de año, receso de
diciembre y semana santa superan holgadamente una semana. El sitio se caería
justo cuando nadie del colegio lo está mirando, que es también cuando puede
entrar una familia o un egresado a buscar algo.

## Decisión

Se permanece en el plan gratuito mientras el proyecto esté en construcción.

## Consecuencias

- El sitio puede aparecer caído tras un periodo de inactividad. Mientras sea un
  ensayo es aceptable; para uso real no lo es.
- Antes de entregar el sitio al colegio hay que plantearles el costo de 25
  dólares mensuales. Conviene hacerlo con antelación y no el día del
  lanzamiento.
- Se descarta mantener el proyecto despierto con consultas automáticas
  periódicas. Funciona, pero depende de cómo Supabase mida la actividad: si eso
  cambia, el sitio se cae sin aviso y sin que nadie sepa por qué.
- Si el colegio digitaliza su archivo histórico completo, el límite de 1 GB se
  alcanzará antes que ningún otro.
