"use client";

import { useMemo, useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { CIUDADES, getBarrios, type Ciudad } from "@/lib/properties";
import { Search, RotateCcw, X, Loader2 } from "lucide-react";

export interface Filters {
  ciudad: "" | Ciudad;
  op: "" | "Venta" | "Alquiler";
  tipo: string[];
  barrio: string;
  precioMin: number;
  precioMax: number;
  moneda: "USD" | "ARS";
  ambientes: number | null;
  dormitorios: number | null;
  supMin: number;
  supMax: number;
  amenities: string[];
  aptoBanco?: boolean;
  permuta?: boolean;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  onClose?: () => void;
}

const TIPOS = ["Casa", "Depto", "PH", "Local", "Terreno"];
const AMENITIES_MAP: Record<string, string> = {
  Cochera: "cochera",
  Balcón: "balcon",
  Jardín: "jardin",
  Parrilla: "parrilla",
  Pileta: "pileta",
};
const AMENITIES = Object.keys(AMENITIES_MAP);

export function SearchFilters({ filters, onChange, onClose }: Props) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    onChange({ ...filters, [k]: v });

  const [cities, setCities] = useState<{ id: string; nombre: string }[]>(
    CIUDADES.map((n) => ({ id: n, nombre: n }))
  );
  const [barrios, setBarrios] = useState<string[]>([]);
  const [barrioSearch, setBarrioSearch] = useState("");

  useEffect(() => {
    api.get<any[]>("/api/lookup/cities")
      .then((cities) => setCities(cities ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!filters.ciudad) { setBarrios([]); return; }
    const city = cities.find((c) => c.nombre === filters.ciudad);
    if (!city) return;
    if (city.id === filters.ciudad) {
      setBarrios(getBarrios(filters.ciudad));
      return;
    }
    api.get<any[]>(`/api/lookup/cities/${city.id}/barrios`)
      .then((barrios) => setBarrios((barrios ?? []).map((b: any) => b.nombre)))
      .catch(() => setBarrios([]));
  }, [filters.ciudad, cities]);

  const barriosFiltrados = useMemo(
    () => barrios.filter((b) => b.toLowerCase().includes(barrioSearch.toLowerCase())),
    [barrios, barrioSearch]
  );

  const activeCount = [
    filters.ciudad ? 1 : 0,
    filters.op ? 1 : 0,
    filters.tipo.length > 0 ? 1 : 0,
    filters.barrio ? 1 : 0,
    filters.precioMin > 0 ? 1 : 0,
    filters.precioMax > 0 ? 1 : 0,
    filters.ambientes !== null ? 1 : 0,
    filters.dormitorios !== null ? 1 : 0,
    filters.supMin > 0 ? 1 : 0,
    filters.supMax > 0 ? 1 : 0,
    filters.amenities.length > 0 ? 1 : 0,
    filters.aptoBanco ? 1 : 0,
    filters.permuta ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAll = () => {
    onChange({
      ciudad: "", op: "", tipo: [], barrio: "", precioMin: 0, precioMax: 0,
      moneda: "USD", ambientes: null, dormitorios: null, supMin: 0, supMax: 0, amenities: [],
      aptoBanco: undefined, permuta: undefined,
    });
  };

  return (
    <aside className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-display text-base font-bold">Filtros</h2>
          <p className="text-[11px] text-muted-foreground">{activeCount} activo{activeCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-1">
          {activeCount > 0 && (
              <button onClick={clearAll} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground" title="Limpiar filtros">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-6">

          <section>
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Ciudad</h3>
            <div className="flex gap-1.5">
              {cities.map((c) => (
                <button key={c.id} onClick={() => set("ciudad", filters.ciudad === c.nombre ? "" : c.nombre)}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-xs font-medium transition ${
                    filters.ciudad === c.nombre
                      ? "border-[oklch(0.78_0.13_80)] bg-[oklch(0.78_0.13_80/0.1)] text-[oklch(0.78_0.13_80)]"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >{c.nombre}</button>
              ))}
            </div>
          </section>

          <hr className="border-border" />

          <section>
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Operación</h3>
            <div className="flex gap-1.5">
              {(["Venta", "Alquiler"] as const).map((o) => (
                <button key={o} onClick={() => set("op", filters.op === o ? "" : o)}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-xs font-medium transition ${
                    filters.op === o
                      ? "border-[oklch(0.78_0.13_80)] bg-[oklch(0.78_0.13_80/0.1)] text-[oklch(0.78_0.13_80)]"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >{o}</button>
              ))}
            </div>
          </section>

          <hr className="border-border" />

          <section>
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Tipo</h3>
            <div className="flex flex-wrap gap-1.5">
              {TIPOS.map((t) => {
                const active = filters.tipo.includes(t);
                return (
                  <button key={t} onClick={() => set("tipo", active ? filters.tipo.filter((x) => x !== t) : [...filters.tipo, t])}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-[oklch(0.78_0.13_80)] bg-[oklch(0.78_0.13_80/0.1)] text-[oklch(0.78_0.13_80)]"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >{t}</button>
                );
              })}
            </div>
          </section>

          <hr className="border-border" />

          <section>
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Barrio</h3>
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={barrioSearch} onChange={(e) => setBarrioSearch(e.target.value)}
                placeholder="Buscar barrio..." className="w-full rounded-lg border border-border bg-background py-2.5 pl-8 pr-3 text-xs" />
            </div>
            <div className="flex max-h-[120px] flex-wrap gap-1.5 overflow-y-auto">
              {barriosFiltrados.map((b, i) => {
                const active = filters.barrio === b;
                return (
                  <button key={filters.ciudad ? b : b + i} onClick={() => set("barrio", active ? "" : b)}
                    className={`rounded-md border px-3 py-1.5 text-[11px] font-medium transition ${
                      active
                        ? "border-[oklch(0.78_0.13_80)] bg-[oklch(0.78_0.13_80/0.1)] text-[oklch(0.78_0.13_80)]"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >{b}</button>
                );
              })}
              {barriosFiltrados.length === 0 && <span className="text-[11px] text-muted-foreground">Sin resultados</span>}
            </div>
          </section>

          <hr className="border-border" />

          <section>
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Precio &middot;{" "}
              <button onClick={() => set("moneda", filters.moneda === "USD" ? "ARS" : "USD")}
                className="underline decoration-dotted underline-offset-2 hover:text-foreground"
              >{filters.moneda}</button>
            </h3>
            <div className="flex items-center gap-2">
              <input type="number" value={filters.precioMin || ""} onChange={(e) => set("precioMin", +e.target.value || 0)}
                placeholder="M&iacute;n" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs" />
              <span className="text-xs text-muted-foreground">&mdash;</span>
              <input type="number" value={filters.precioMax || ""} onChange={(e) => set("precioMax", +e.target.value || 0)}
                placeholder="M&aacute;x" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs" />
            </div>
          </section>

          <hr className="border-border" />

          <section>
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Ambientes</h3>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => set("ambientes", filters.ambientes === n ? null : n)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    filters.ambientes === n
                      ? "border-[oklch(0.78_0.13_80)] bg-[oklch(0.78_0.13_80/0.1)] text-[oklch(0.78_0.13_80)]"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >{n}+</button>
              ))}
            </div>
          </section>

          <hr className="border-border" />

          <section>
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Dormitorios</h3>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <button key={n} onClick={() => set("dormitorios", filters.dormitorios === n ? null : n)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    filters.dormitorios === n
                      ? "border-[oklch(0.78_0.13_80)] bg-[oklch(0.78_0.13_80/0.1)] text-[oklch(0.78_0.13_80)]"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >{n}+</button>
              ))}
            </div>
          </section>

          <hr className="border-border" />

          <section>
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Superficie (m&sup2;)</h3>
            <div className="flex items-center gap-2">
              <input type="number" value={filters.supMin || ""} onChange={(e) => set("supMin", +e.target.value || 0)}
                placeholder="M&iacute;n" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs" />
              <span className="text-xs text-muted-foreground">&mdash;</span>
              <input type="number" value={filters.supMax || ""} onChange={(e) => set("supMax", +e.target.value || 0)}
                placeholder="M&aacute;x" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs" />
            </div>
          </section>

          <hr className="border-border" />

          <section>
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Amenities</h3>
            <div className="flex flex-wrap gap-1.5">
              {AMENITIES.map((a) => {
                const key = AMENITIES_MAP[a];
                const active = filters.amenities.includes(key);
                return (
                  <button key={a} onClick={() => set("amenities", active ? filters.amenities.filter((x) => x !== key) : [...filters.amenities, key])}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      active
                        ? "border-[oklch(0.78_0.13_80)] bg-[oklch(0.78_0.13_80/0.1)] text-[oklch(0.78_0.13_80)]"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >{a}</button>
                );
              })}
            </div>
          </section>

        </div>
      </div>
    </aside>
  );
}
