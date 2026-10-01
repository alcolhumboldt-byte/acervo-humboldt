/**
 * Símbolo de Acervo: un edificio sobre un libro abierto, con unos píxeles
 * desprendiéndose — institución, conocimiento y archivo digital.
 *
 * Dibujado en un solo color mediante `currentColor`, para que tome el tono de
 * donde se coloque: oscuro sobre papel, claro sobre fondos oscuros. Esa fue la
 * decisión al conservar el morado del sitio: el logo va en monocromo y no
 * compite con la paleta.
 */
export function LogoAcervo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Acervo"
    >
      {/*
        Edificio con una hendidura vertical. Las dos subrutas van en un mismo
        trazado con regla «evenodd»: así la hendidura es un hueco de verdad y
        deja ver el fondo, en lugar de ser una mancha blanca que delataría
        cualquier superficie que no fuese blanca.
      */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19 34V17.2L26.6 11h11.2L45 17.2V34H19Zm10.6-16.4h4.8V34h-4.8V17.6Z"
        fill="currentColor"
        opacity="0.92"
      />

      {/* Píxeles: el archivo en papel volviéndose digital. */}
      <rect x="47.6" y="10.6" width="5" height="5" fill="currentColor" opacity="0.3" />
      <rect x="54.4" y="17.4" width="5" height="5" fill="currentColor" opacity="0.6" />
      <rect x="47.6" y="24.2" width="5" height="5" fill="currentColor" opacity="0.42" />

      {/* Libro abierto. Dos planos por hoja: cada año añade una capa. */}
      <path
        d="M4.5 35.2c10.4 0 19.9 2.3 26.5 6.5v6.6c-6.6-4.2-16.1-6.5-26.5-6.5v-6.6Z"
        fill="currentColor"
        opacity="0.4"
      />
      <path
        d="M59.5 35.2c-10.4 0-19.9 2.3-26.5 6.5v6.6c6.6-4.2 16.1-6.5 26.5-6.5v-6.6Z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="M4.5 43.3c10.4 0 19.9 2.3 26.5 6.5v6.6c-6.6-4.2-16.1-6.5-26.5-6.5v-6.6Z"
        fill="currentColor"
        opacity="0.78"
      />
      <path
        d="M59.5 43.3c-10.4 0-19.9 2.3-26.5 6.5v6.6c6.6-4.2 16.1-6.5 26.5-6.5v-6.6Z"
        fill="currentColor"
      />
    </svg>
  );
}
