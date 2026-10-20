import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { inspectToken } from "@/modules/access/approvals";
import { DownloadButton } from "./download-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Documento",
  // Un enlace de entrega no debe acabar en un buscador.
  robots: { index: false, follow: false },
};

const EXPLICACIONES: Record<string, string> = {
  USADO:
    "Este enlace ya se usó. Sirve una sola vez, así que si necesitas el documento otra vez habrá que pedirlo de nuevo.",
  CADUCADO:
    "Este enlace caducó. Los enlaces valen siete días desde que se aprueban.",
  NO_EXISTE:
    "Este enlace no es válido. Puede que esté incompleto: revisa que lo hayas copiado entero.",
  SIN_DOCUMENTO:
    "El documento de este proyecto ya no está disponible.",
};

export default async function Documento({
  params,
}: PageProps<"/documentos/[token]">) {
  const { token } = await params;

  // Mirar el estado no gasta el enlace. Entregarlo al abrir la página haría
  // que la previsualización de WhatsApp o del correo lo quemara antes de que
  // la persona llegara a pulsar nada.
  const estado = await inspectToken(token);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-16 pb-24">
        {estado.estado === "VALIDO" ? (
          <>
            <h1 className="font-titulo text-3xl leading-tight tracking-tight text-tinta">
              Tu solicitud fue aprobada
            </h1>

            <p className="mt-4 text-azul">{estado.projectTitle}</p>

            <p className="mt-6 max-w-[60ch] leading-relaxed text-gris-texto">
              El documento lleva una marca de agua del colegio en todas sus
              páginas. Es trabajo de estudiantes menores de edad: cítalo
              indicando su procedencia y no lo redistribuyas.
            </p>

            <DownloadButton token={token} />
          </>
        ) : (
          <>
            <h1 className="font-titulo text-3xl leading-tight tracking-tight text-tinta">
              No podemos entregar este documento
            </h1>

            <p className="mt-6 max-w-[60ch] leading-relaxed text-gris-texto">
              {EXPLICACIONES[estado.estado]}
            </p>

            <Link
              href="/proyectos"
              className="mt-8 inline-block text-morado-hondo underline underline-offset-4"
            >
              Ver el archivo de proyectos
            </Link>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
