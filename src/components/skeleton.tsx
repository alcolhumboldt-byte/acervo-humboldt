/** Bloque gris con destello, del tamaño del contenido que va a ocupar. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`destella block rounded ${className}`} />;
}

/** Marca del mismo alto y forma que una tarjeta de proyecto, para que la
 *  página no salte cuando llegan los datos. */
export function ProjectCardSkeleton({ indice = 0 }: { indice?: number }) {
  return (
    <div
      style={{ "--indice": indice } as React.CSSProperties}
      className="aparece rounded-pieza bg-blanco p-7 ring-1 ring-gris ring-inset"
    >
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-4 h-5 w-full" />
      <Skeleton className="mt-2 h-5 w-2/3" />
      <Skeleton className="mt-5 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
      <Skeleton className="mt-7 h-3 w-28" />
    </div>
  );
}
