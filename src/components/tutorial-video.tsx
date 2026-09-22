/** Video corto que explica qué es Acervo y cómo usarlo. Vive justo debajo
 *  del encabezado para que un visitante nuevo lo vea sin tener que buscarlo. */
export function TutorialVideo() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <div className="rounded-pieza border border-gris bg-blanco p-6 shadow-capa sm:p-8">
        <h2 className="font-titulo text-2xl tracking-tight text-tinta">
          ¿Cómo funciona Acervo?
        </h2>
        <p className="mt-2 max-w-[60ch] text-gris-texto">
          Un recorrido corto de minuto y medio: qué es el archivo, cómo
          explorarlo y cómo buscar proyectos.
        </p>
        <video
          className="mt-6 w-full rounded-pieza bg-tinta"
          controls
          preload="metadata"
          src="/tutorial/acervo-tutorial.mp4"
        >
          Tu navegador no puede reproducir este video.
        </video>
      </div>
    </section>
  );
}
