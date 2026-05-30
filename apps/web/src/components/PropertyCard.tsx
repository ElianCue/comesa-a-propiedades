import Link from "next/link";
import Image from "next/image";
import { Bed, Bath, Maximize2, MapPin } from "lucide-react";
import { formatPrice, type Property } from "@/lib/properties";

interface Props {
  p: Property;
  variant?: "grid" | "list";
}

export function PropertyCard({ p, variant = "grid" }: Props) {
  if (variant === "list") {
    return (
      <Link
        href={`/propiedad/${p.id}`}
        className="group flex flex-col overflow-hidden rounded-xl bg-card shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl sm:flex-row"
      >
        <div className="relative aspect-[4/3] w-full flex-shrink-0 overflow-hidden bg-muted sm:w-72 sm:aspect-[4/3]">
          {p.fotos && p.fotos[0] ? (
            <Image
              src={p.fotos[0]}
              alt={p.direccion}
              fill
              className="object-cover transition duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 288px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
              Sin foto
            </div>
          )}
          <span
            className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white ${
              p.operacion === "Venta"
                ? "bg-[oklch(0.32_0.08_255)]"
                : "bg-[oklch(0.45_0.15_25)]"
            }`}
          >
            {p.operacion}
          </span>
          <span className="absolute right-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
            {p.tipo}
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-2 p-5">
          <div className="font-display text-xl font-bold tracking-tight text-[oklch(0.78_0.13_80)]">
            {formatPrice(p)}
          </div>
          <div className="text-sm font-medium text-foreground">{p.direccion}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {p.barrio}, {p.ciudad ?? "La Plata"}
          </div>

          <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground border-t border-[oklch(0.85_0.03_80/0.3)]">
            <span className="flex items-center gap-1.5">
              <Bed className="h-3.5 w-3.5" />
              {p.dormitorios}
            </span>
            <span className="flex items-center gap-1.5">
              <Bath className="h-3.5 w-3.5" />
              {p.banos}
            </span>
            <span className="flex items-center gap-1.5">
              <Maximize2 className="h-3.5 w-3.5" />
              {p.m2Totales} m&sup2;
            </span>
          </div>

          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[oklch(0.32_0.08_255)] md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
            Ver detalles &rarr;
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/propiedad/${p.id}`}
        className="group flex flex-col rounded-xl bg-card shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
    >
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-muted">
          {p.fotos && p.fotos[0] ? (
            <Image
              src={p.fotos[0]}
              alt={p.direccion}
              fill
              className="object-cover transition duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-t-xl bg-muted text-sm text-muted-foreground">
              Sin foto
            </div>
          )}
        <span
          className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white ${
            p.operacion === "Venta"
              ? "bg-[oklch(0.32_0.08_255)]"
              : "bg-[oklch(0.45_0.15_25)]"
          }`}
        >
          {p.operacion}
        </span>
        <span className="absolute right-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
          {p.tipo}
        </span>

          {p.fotos.length > 1 && (
            <span className="absolute bottom-3 right-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white">
              +{p.fotos.length - 1}
            </span>
          )}
          {(p as any).aptoBanco && (
            <span className="absolute bottom-3 left-3 z-10 rounded-full bg-[oklch(0.55_0.15_150)] px-2.5 py-1 text-[10px] font-semibold text-white">
              Apto banco
            </span>
          )}
          {(p as any).permuta && (
            <span className="absolute bottom-3 left-[80px] z-10 rounded-full bg-[oklch(0.45_0.15_25)] px-2.5 py-1 text-[10px] font-semibold text-white">
              Permuta
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="font-display text-xl font-bold tracking-tight text-[oklch(0.78_0.13_80)]">
          {formatPrice(p)}
        </div>
        <div className="text-sm font-medium text-foreground">{p.direccion}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {p.barrio}, {p.ciudad ?? "La Plata"}
        </div>

        <div className="flex items-center gap-4 border-t border-[oklch(0.85_0.03_80/0.3)] pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Bed className="h-3.5 w-3.5" />
            {p.dormitorios}
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="h-3.5 w-3.5" />
            {p.banos}
          </span>
          <span className="flex items-center gap-1.5">
            <Maximize2 className="h-3.5 w-3.5" />
            {p.m2Totales} m&sup2;
          </span>
        </div>

        <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[oklch(0.32_0.08_255)] md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          Ver detalles &rarr;
        </div>
      </div>
    </Link>
  );
}
