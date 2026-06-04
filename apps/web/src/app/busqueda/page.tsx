"use client";

import { useMemo, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchFilters, type Filters } from "@/components/SearchFilters";
import { PropertyCard } from "@/components/PropertyCard";
import { Pagination } from "@/components/Pagination";
import { useProperties } from "@/hooks/useProperties";
import { CIUDADES, getBarrios, type Ciudad, type Property } from "@/lib/properties";
import { api } from "@/lib/api-client";
import {
  Grid3X3,
  List,
  SlidersHorizontal,
  RotateCcw,
  Bell,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const PER_PAGE = 9;
const TIPOS = ["Casa", "Depto", "PH", "Local", "Terreno"];

type SortKey = "relevance" | "price-asc" | "price-desc" | "m2-asc" | "m2-desc";

const defaultFilters: Filters = {
  ciudad: "", op: "", tipo: [], barrio: "", precioMin: 0, precioMax: 0,
  moneda: "USD", ambientes: null, dormitorios: null, supMin: 0, supMax: 0, amenities: [],
  aptoBanco: undefined, permuta: undefined,
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
    aptoBanco: params.has("aptoBanco") ? params.get("aptoBanco") === "true" : undefined,
    permuta: params.has("permuta") ? params.get("permuta") === "true" : undefined,
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
  if (f.aptoBanco !== undefined) p.set("aptoBanco", "true");
  if (f.permuta !== undefined) p.set("permuta", "true");
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
  if (f.aptoBanco !== undefined && !p.aptoBanco) return false;
  if (f.permuta !== undefined && !p.permuta) return false;
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
  const [view, setView] = useState<"grid" | "list">("grid");
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

  const [alertEmail, setAlertEmail] = useState("");
  const [alertSent, setAlertSent] = useState(false);
  const [alertSending, setAlertSending] = useState(false);
  const [alertError, setAlertError] = useState("");

  const submitAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail) return;
    setAlertSending(true);
    setAlertError("");
    try {
      await api.post("/api/property-alerts", {
        email: alertEmail,
        ciudad: filters.ciudad || undefined,
        operacion: filters.op || undefined,
        tipo: filters.tipo.length === 1 ? filters.tipo[0] : undefined,
        barrio: filters.barrio || undefined,
        precio_min: filters.precioMin > 0 ? filters.precioMin : undefined,
        precio_max: filters.precioMax > 0 ? filters.precioMax : undefined,
        moneda: filters.moneda !== "USD" ? filters.moneda : undefined,
        ambientes: filters.ambientes ?? undefined,
        dormitorios: filters.dormitorios ?? undefined,
      });
      setAlertSent(true);
    } catch {
      setAlertError("Error al guardar. Intente de nuevo.");
    } finally {
      setAlertSending(false);
    }
  };

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
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center justify-between">
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
              <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
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

          {/* Compact filter bar */}
          <div className="mt-3 flex flex-wrap items-center gap-2 pb-1">
            <select
              value={filters.ciudad}
              onChange={(e) => updateFilters({ ...filters, ciudad: e.target.value as "" | Ciudad, barrio: "" })}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none"
            >
              <option value="">Todas las ciudades</option>
              {CIUDADES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={filters.op}
              onChange={(e) => updateFilters({ ...filters, op: e.target.value as "" | "Venta" | "Alquiler" })}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none"
            >
              <option value="">Venta y Alquiler</option>
              <option value="Venta">Venta</option>
              <option value="Alquiler">Alquiler</option>
            </select>
            <select
              value={filters.barrio}
              onChange={(e) => updateFilters({ ...filters, barrio: e.target.value })}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none"
            >
              <option value="">Todos los barrios</option>
              {getBarrios(filters.ciudad).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select
              value={filters.tipo.length === 1 ? filters.tipo[0] : ""}
              onChange={(e) => updateFilters({ ...filters, tipo: e.target.value ? [e.target.value] : [] })}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none"
            >
              <option value="">Todos los tipos</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={filters.ambientes !== null ? String(filters.ambientes) : ""}
              onChange={(e) => updateFilters({ ...filters, ambientes: e.target.value ? Number(e.target.value) : null })}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground outline-none"
            >
              <option value="">Cualquier ambiente</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}+ amb.</option>
              ))}
            </select>
            {(filters.ciudad || filters.op || filters.barrio || filters.tipo.length > 0 || filters.ambientes !== null) && (
              <button
                onClick={() => updateFilters(defaultFilters)}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Limpiar
              </button>
            )}
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
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4">
                <SlidersHorizontal className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">
                Sin resultados
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Probá ajustando los filtros para encontrar más propiedades.
              </p>

              <div className="mt-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 text-left">
                <div className="mb-1 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[oklch(0.78_0.13_80)]" />
                  <h4 className="font-display text-base font-semibold">
                    ¿No encontrás lo que buscás?
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Dejanos tu mail y te avisamos cuando aparezca una
                  propiedad con tus preferencias.
                </p>

                {alertSent ? (
                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-[oklch(0.55_0.15_150/0.3)] bg-[oklch(0.55_0.15_150/0.08)] px-4 py-3 text-sm text-[oklch(0.6_0.15_150)]">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    Te avisaremos cuando haya novedades
                  </div>
                ) : (
                  <form onSubmit={submitAlert} className="mt-5 flex gap-2">
                    <input
                      type="email"
                      value={alertEmail}
                      onChange={(e) => setAlertEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition focus:border-[oklch(0.78_0.13_80)] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={alertSending}
                      className="flex items-center gap-2 rounded-lg bg-[oklch(0.32_0.08_255)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                    >
                      {alertSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Avisarme"
                      )}
                    </button>
                  </form>
                )}
                {alertError && (
                  <p className="mt-2 text-xs text-destructive">{alertError}</p>
                )}
              </div>
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
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[oklch(0.78_0.13_80)] border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>
          </div>
        </div>
      }
    >
      <BusquedaContent />
    </Suspense>
  );
}
