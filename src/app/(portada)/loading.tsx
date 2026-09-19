import { ProjectCardSkeleton, Skeleton } from "@/components/skeleton";
import { SiteHeader } from "@/components/site-header";

/** Reserva el mismo espacio que la portada real para que no salte al llegar. */
export default function Cargando() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-20 pb-24">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Skeleton className="h-12 w-full max-w-xl" />
            <Skeleton className="mt-4 h-12 w-3/4 max-w-lg" />
            <Skeleton className="mt-8 h-4 w-full max-w-md" />
            <Skeleton className="mt-3 h-4 w-5/6 max-w-md" />
            <Skeleton className="mt-9 h-12 w-48 rounded-pieza" />
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <div className="divide-y divide-gris border-t border-gris">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between py-5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ProjectCardSkeleton />
          </div>
          <ProjectCardSkeleton indice={1} />
          <ProjectCardSkeleton indice={2} />
        </div>
      </main>
    </div>
  );
}
