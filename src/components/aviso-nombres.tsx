/** Explica por qué los nombres aparecen reducidos. Va en toda página que
 *  muestre autores. */
export function AvisoNombres() {
  return (
    <p className="max-w-2xl text-sm leading-relaxed text-gris-texto">
      Los autores son estudiantes menores de edad. Por eso sus nombres se
      muestran reducidos, y el nombre completo solo aparece cuando la familia ha
      firmado la autorización correspondiente.
    </p>
  );
}
