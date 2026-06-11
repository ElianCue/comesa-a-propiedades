"use client";

import { useMemo, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchFilters, type Filters } from "@/components/SearchFilters";
import { PropertyCard } from "@/components/PropertyCard";
import { Pagination } from "@/components/Pagination";
import { useProperties } from "@/hooks/useProperties";
import type { Property } from "@/lib/properties";
import { Grid3X3, List, SlidersHorizontal } from "lucide-react";

const PER_PAGE = 9;

type SortKey = "relevance" | "price-asc" | "price-desc" | "m2-asc" | "m2-desc";

const defaultFilters: Filters = {
  ciudad: "", op: "", tipo: [], barrio: "", precioMin: 0, precioMax: 0,
  moneda: "USD", ambientes: null, dormitorios: null, supMin: 0, supMax: 0, amenities: [],
};

function parseFilters(params: URLSearchParams): Filters {
  return {
    ciudad: (params.get("ciudad") as Filters["ciudad"]) || "",
    op: (params.get("op") as Filters["op"]) || "",
    tipo: params.get("tipo")?.split(",").filter(Boolean) || [],
    barrio: params.get("barrio") || "",
    precioMin: Number(params.get("precioMin")) || 0,
    precioMax: Number(params.get("precioMax")) || 0,
    moneda: (params.get("moneda") as Filters["moneda"]) || "USD",
    ambientes: params.has("ambientes") ? Number(params.get("ambientes")) || 0 : null,
    dormitorios: params.has("dormitorios") ? Number(params.get("dormitorios")) || 0 : null,
    supMin: Number(params.get("supMin")) || 0,
    supMax: Number(params.get("supMax")) || 0,
    amenities: params.get("amenities")?.split(",").filter(Boolean) || [],
  };
}

function filtersToParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.ciudad) p.set("ciudad", f.ciudad);
  if (f.op) p.set("op", f.op);
  if (f.tipo.length > 0) p.set("tipo", f.tipo.join(","));
  if (f.barrio) p.set("barrio", f.barrio);
  if (f.precioMin > 0) p.set("precioMin", String(f.precioMin));
  if (f.precioMax > 0) p.set("precioMax", String(f.precioMax));
  if (f.moneda !== "USD") p.set("moneda", f.moneda);
  if (f.ambientes !== null) p.set("ambientes", String(f.ambientes));
  if (f.dormitorios !== null) p.set("dormitorios", String(f.dormitorios));
  if (f.supMin > 0) p.set("supMin", String(f.supMin));
  if (f.supMax > 0) p.set("supMax", String(f.supMax));
  if (f.amenities.length > 0) p.set("amenities", f.amenities.join(","));
  return p;
}

function matchProperty(p: Property, f: Filters): boolean {
  if (!p.activo) return false;
  if (f.ciudad && (p.ciudad ?? "La Plata") !== f.ciudad) return false;
  if (f.op && p.operacion !== f.op) return false;
  if (f.tipo.length > 0 && !f.tipo.includes(p.tipo)) return false;
  if (f.barrio && p.barrio !== f.barrio) return false;
  if (f.precioMin > 0 && p.precio < f.precioMin) return false;
  if (f.precioMax > 0 && p.precio > f.precioMax) return false;
  if (f.ambientes !== null && p.ambientes < f.ambientes) return false;
  if (f.dormitorios !== null && p.dormitorios < f.dormitorios) return false;
  if (f.supMin > 0 && p.m2Totales < f.supMin) return false;
  if (f.supMax > 0 && p.m2Totales > f.supMax) return false;
  if (f.amenities.length > 0) {
    for (const a of f.amenities) {
      if (!(p as unknown as Record<string, unknown>)[a]) return false;
    }
  }
  return true;
}

function sortProperties(props: Property[], sort: SortKey): Property[] {
  const sorted = [...props];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.precio - b.precio);
    case "price-desc":
      return sorted.sort((a, b) => b.precio - a.precio);
    case "m2-asc":
      return sorted.sort((a, b) => a.m2Totales - b.m2Totales);
    case "m2-desc":
      return sorted.sort((a, b) => b.m2Totales - a.m2Totales);
    default:
      return sorted;
  }
}

function BusquedaContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [all] = useProperties();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [view, setView] = useState<"grid" | "list">("list");
  const page = useMemo(() => Math.max(1, Number(params.get("page")) || 1), [params]);

  const filters = useMemo(() => parseFilters(params), [params]);

  const updateFilters = useCallback(
    (f: Filters) => {
      const p = filtersToParams(f);
      const s = p.toString();
      router.push(`/busqueda${s ? `?${s}` : ""}`, { scroll: false });
    },
    [router],
  );

  const filtered = useMemo(
    () => all.filter((p) => matchProperty(p, filters)),
    [all, filters],
  );

  const sorted = useMemo(
    () => sortProperties(filtered, sort),
    [filtered, sort],
  );

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const paginated = sorted.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE,
  );

  const goToPage = useCallback(
    (p: number) => {
      const p2 = filtersToParams(filters);
      if (p > 1) p2.set("page", String(p));
      const s = p2.toString();
      router.push(`/busqueda${s ? `?${s}` : ""}`, { scroll: false });
    },
    [router, filters],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div
        className="sticky top-16 z-30 border-b border-border bg-[color:var(--background)_/0.95] backdrop-blur-xl"
        style={{ backgroundColor: "var(--background, #ffffff)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-muted-foreground transition hover:text-foreground md:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
            </button>
            <p className="text-xs text-muted-foreground">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1 rounded-lg border border-border p-0.5">
              <button
                onClick={() => setView("grid")}
                className={`rounded-md p-1.5 transition ${
                  view === "grid"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`rounded-md p-1.5 transition ${
                  view === "list"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="bg-transparent text-xs font-medium text-foreground outline-none"
              >
                <option value="relevance">Relevancia</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
                <option value="m2-asc">Menor superficie</option>
                <option value="m2-desc">Mayor superficie</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-72 flex-shrink-0 border-r border-border md:block">
          <SearchFilters filters={filters} onChange={updateFilters} />
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] shadow-xl">
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ backgroundColor: "var(--background, #ffffff)" }}
              />
              <div className="relative h-full">
                <SearchFilters
                  filters={filters}
                  onChange={(f) => {
                    updateFilters(f);
                    setSidebarOpen(false);
                  }}
                  onClose={() => setSidebarOpen(false)}
                />
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 px-6 py-8">
          {paginated.length > 0 ? (
            <>
              <div
                className={
                  view === "grid"
                    ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
                    : "flex flex-col gap-4"
                }
              >
                {paginated.map((p, i) => (
                  <div
                    key={p.id}
                    className={
                      view === "grid" && currentPage === 1 && i === 0 && filtered.length > 1
                        ? "sm:col-span-2 xl:col-span-2"
                        : ""
                    }
                  >
                    <PropertyCard p={p} variant={view === "list" ? "list" : "grid"} />
                  </div>
                ))}
              </div>
              <Pagination
                page={currentPage}
                total={sorted.length}
                perPage={PER_PAGE}
                onChange={goToPage}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-muted p-4">
                <SlidersHorizontal className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">
                Sin resultados
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Probá ajustando los filtros para encontrar más propiedades.
              </p>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default function BusquedaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>
          </div>
        </div>
      }
    >
      <BusquedaContent />
    </Suspense>
  );
}
