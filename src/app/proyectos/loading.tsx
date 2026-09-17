import { ProjectCardSkeleton, Skeleton } from "@/components/skeleton";
import { SiteHeader } from "@/components/site-header";

export default function Cargando() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-12 pb-24">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-8 h-32 w-full rounded-pieza" />
        <Skeleton className="mt-8 h-3 w-44" />

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <ProjectCardSkeleton key={i} indice={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
