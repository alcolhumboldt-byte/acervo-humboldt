import type { Metadata } from "next";
import { PanelHeader } from "@/components/panel-header";
import {
  listApprovedRequests,
  listPendingRequests,
} from "@/modules/access/approvals";
import { ApprovedCard } from "./approved-card";
import { RequestCard } from "./request-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Solicitudes" };

const FECHA = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "long",
  timeStyle: "short",
});

export default async function Solicitudes() {
  const [pendientes, aprobadas] = await Promise.all([
    listPendingRequests(),
    listApprovedRequests(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <PanelHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-12 pb-24">
        <h1 className="font-titulo text-3xl tracking-tight text-tinta">
          Solicitudes de documentos
        </h1>

        <p className="mt-3 max-w-[62ch] leading-relaxed text-gris-texto">
          Cada una pide el documento completo de un proyecto. Al aprobarla se
          genera un enlace que sirve una sola vez y caduca en siete días; habrá
          que hacérselo llegar a quien lo pidió.
        </p>

        {pendientes.length === 0 ? (
          <div className="mt-10 rounded-pieza border border-dashed border-gris px-8 py-14 text-center">
            <p className="font-titulo text-xl text-tinta">
              No hay solicitudes pendientes
            </p>
            <p className="mx-auto mt-3 max-w-[48ch] leading-relaxed text-gris-texto">
              Cuando alguien pida el documento de un proyecto publicado,
              aparecerá aquí con el motivo que haya escrito.
            </p>
          </div>
        ) : (
          <ul className="mt-10 space-y-5">
            {pendientes.map((s) => (
              <RequestCard
                key={s.id}
                id={s.id}
                requesterName={s.requesterName}
                requesterEmail={s.requesterEmail}
                reason={s.reason}
                createdAt={FECHA.format(s.createdAt)}
                projectTitle={s.projectTitle}
              />
            ))}
          </ul>
        )}
        {aprobadas.length > 0 ? (
          <section className="mt-16 border-t border-gris pt-10">
            <h2 className="font-titulo text-2xl tracking-tight text-tinta">
              Ya aprobadas
            </h2>

            <p className="mt-3 max-w-[62ch] leading-relaxed text-gris-texto">
              Del enlace solo se guarda su huella, así que no se puede volver a
              mostrar el que se generó. Si se perdió, aquí se emite uno nuevo
              —el anterior deja de servir en ese momento—.
            </p>

            <ul className="mt-8 space-y-5">
              {aprobadas.map((s) => (
                <ApprovedCard
                  key={s.id}
                  id={s.id}
                  requesterName={s.requesterName}
                  requesterEmail={s.requesterEmail}
                  decidedAt={s.decidedAt ? FECHA.format(s.decidedAt) : "—"}
                  projectTitle={s.projectTitle}
                  usado={s.usado}
                  caducado={s.caducado}
                />
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
