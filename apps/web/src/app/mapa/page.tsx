"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useProperties } from "@/hooks/useProperties";
import { CIUDADES, getBarrios, formatPriceFromProperty, type Property, type Ciudad } from "@/lib/properties";
import {
  Search,
  X,
  SlidersHorizontal,
  Bed,
  Bath,
  Maximize2,
  MapPin,
  Building2,
  RotateCcw,
} from "lucide-react";

declare global {
  interface Window {
    L: any;
  }
}

const TIPOS = ["Casa", "Depto", "PH", "Local"];

export default function MapaPage() {
  const [all] = useProperties();
  const [ciudad, setCiudad] = useState<Ciudad | "">("");
  const [op, setOp] = useState<"Venta" | "Alquiler">("Venta");
  const [tipos, setTipos] = useState<string[]>([]);
  const [zonas, setZonas] = useState<string[]>([]);
  const [amb, setAmb] = useState<number | null>(null);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(500000);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [zonaSearch, setZonaSearch] = useState("");
  const [clickKey, setClickKey] = useState(0);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<Record<string, any>>({});
  const listRef = useRef<HTMLDivElement>(null);

  const barriosDisponibles = useMemo(() => getBarrios(ciudad), [ciudad]);

  const filtered = useMemo(
    () =>
      all.filter((p) => {
        if (!p.activo) return false;
        if (ciudad && (p.ciudad ?? "La Plata") !== ciudad) return false;
        if (p.operacion !== op) return false;
        if (tipos.length && !tipos.includes(p.tipo)) return false;
        if (zonas.length && !zonas.includes(p.barrio)) return false;
        if (amb !== null) {
          if (amb === 4 ? p.ambientes < 4 : p.ambientes !== amb) return false;
        }
        if (p.precio < priceMin || p.precio > priceMax) return false;
        return true;
      }),
    [all, ciudad, op, tipos, zonas, amb, priceMin, priceMax]
  );

  useEffect(() => {
    setPriceMax(op === "Venta" ? 500000 : 1000000);
    setPriceMin(0);
  }, [op]);

  const hasFilters = ciudad !== "" || op !== "Venta" || tipos.length > 0 || zonas.length > 0 || amb !== null || priceMin > 0 || priceMax < 500000;

  const clearFilters = () => {
    setCiudad("");
    setOp("Venta");
    setTipos([]);
    setZonas([]);
    setAmb(null);
    setPriceMin(0);
    setPriceMax(500000);
  };

  const popupHtml = (p: Property) =>
    `<div style="font-family:DM Sans,sans-serif;width:240px;border-radius:12px;overflow:hidden"><img src="${p.fotos[0]}" style="width:100%;height:130px;object-fit:cover"/><div style="padding:12px 14px"><div style="font-weight:700;font-size:17px;margin-bottom:2px;color:oklch(0.78 0.13 80)">${formatPriceFromProperty(p)}</div><div style="font-size:13px;color:#222;margin-bottom:4px">${p.direccion}</div><div style="font-size:11px;color:#888;margin-bottom:10px">${p.barrio}, ${p.ciudad} · ${p.m2Totales}m² · ${p.dormitorios} dorm</div><a href="/propiedad/${p.id}" style="display:inline-block;width:100%;padding:9px 0;background:oklch(0.32 0.08 255);color:white;border-radius:8px;font-size:13px;font-weight:600;text-align:center;text-decoration:none">Ver detalles</a></div></div>`;

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstance.current) return;
    const L = window.L;
    if (!L) return;
    mapInstance.current = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([-34.9215, -57.9545], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(mapInstance.current);
    setTimeout(() => mapInstance.current?.invalidateSize(), 100);
    setLeafletReady(true);
  }, []);

  useEffect(() => {
    if (mapInstance.current) return;
    if (window.L) {
      initMap();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = initMap;
    document.head.appendChild(s);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [initMap]);

  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstance.current || !leafletReady) return;
    Object.values(markers.current).forEach((m: any) => m.remove());
    markers.current = {};

    if (filtered.length === 0) return;

    filtered.forEach((p) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${p.operacion === "Venta" ? "oklch(0.32 0.08 255)" : "oklch(0.45 0.15 25)"};color:white;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;font-family:DM Sans,sans-serif;white-space:nowrap;box-shadow:0 3px 12px rgba(0,0,0,0.35);border:2.5px solid white">${formatPriceFromProperty(p)}</div>`,
        iconSize: [140, 36],
        iconAnchor: [70, 36],
      });
      const m = L.marker([p.lat, p.lng], { icon }).addTo(mapInstance.current);
      m.on("click", () => {
        setActiveId(p.id);
        setClickKey((k) => k + 1);
        if (listRef.current) {
          const el = listRef.current.querySelector(`[data-id="${p.id}"]`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
      markers.current[p.id] = m;
    });

    try {
      const markerArr = Object.values(markers.current);
      if (markerArr.length > 0) {
        const group = L.featureGroup(markerArr);
        const bounds = group.getBounds();
        if (bounds.isValid()) {
          mapInstance.current.fitBounds(bounds.pad(0.15));
        }
      }
    } catch {
      // bounds not ready
    }
  }, [filtered, leafletReady]);

  useEffect(() => {
    if (!activeId || !mapInstance.current) return;
    const m = markers.current[activeId];
    const p = filtered.find((x) => x.id === activeId);
    if (m && p) {
      mapInstance.current.setView([p.lat, p.lng], 15, { animate: true, duration: 0.3 });
      m.bindPopup(popupHtml(p));
      m.openPopup();
    }
  }, [activeId, filtered, clickKey]);

  useEffect(() => {
    if (activeId && listRef.current) {
      const el = listRef.current.querySelector(`[data-id="${activeId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeId]);

  const toggle = <T,>(arr: T[], v: T) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const zonasFiltradas = barriosDisponibles.filter((b) =>
    b.toLowerCase().includes(zonaSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-shrink-0">
        <Navbar />
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Mobile toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold shadow-lg backdrop-blur-xl md:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
        </button>

        {/* Sidebar */}
        <aside
          className={`absolute inset-y-0 left-0 z-10 flex w-[340px] flex-col border-r border-border bg-card transition-transform duration-300 md:relative md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-bold">Mapa</h2>
              <p className="text-xs text-muted-foreground">
                {filtered.length} propiedad{filtered.length !== 1 ? "es" : ""}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  title="Limpiar filtros"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground md:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-5 border-b border-border px-5 py-5">
            {/* Ciudad */}
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Ciudad
              </div>
              <div className="flex gap-1 rounded-xl bg-muted p-1">
                <button
                  onClick={() => { setCiudad(""); setZonas([]); }}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                    ciudad === ""
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Todas
                </button>
                {CIUDADES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCiudad(c); setZonas([]); }}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                      ciudad === c
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Operación */}
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Operación
              </div>
              <div className="flex gap-1 rounded-xl bg-muted p-1">
                {(["Venta", "Alquiler"] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() => setOp(o)}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                      op === o
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo */}
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Tipo
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TIPOS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTipos(toggle(tipos, t))}
                    className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition ${
                      tipos.includes(t)
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Precio */}
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Precio &middot; {op === "Venta" ? "USD" : "ARS"}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    value={priceMin || ""}
                    onChange={(e) => setPriceMin(+e.target.value || 0)}
                    className="w-full rounded-lg border border-border bg-background py-2 pl-7 pr-3 text-xs"
                    placeholder="Mín"
                  />
                </div>
                <span className="text-xs text-muted-foreground">&mdash;</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    value={priceMax || ""}
                    onChange={(e) => setPriceMax(+e.target.value || 0)}
                    className="w-full rounded-lg border border-border bg-background py-2 pl-7 pr-3 text-xs"
                    placeholder="Máx"
                  />
                </div>
              </div>
            </div>

            {/* Ambientes */}
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Ambientes
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setAmb(amb === n ? null : n)}
                    className={`h-9 flex-1 rounded-lg border text-xs font-semibold transition ${
                      amb === n
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {n === 4 ? "4+" : n}
                  </button>
                ))}
              </div>
            </div>

            {/* Barrio */}
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Barrio
              </div>
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={zonaSearch}
                  onChange={(e) => setZonaSearch(e.target.value)}
                  placeholder="Buscar barrio..."
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs"
                />
              </div>
              <div className="flex max-h-[100px] flex-wrap gap-1.5 overflow-y-auto">
                {zonasFiltradas.map((b) => (
                  <button
                    key={b}
                    onClick={() => setZonas(toggle(zonas, b))}
                    className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
                      zonas.includes(b)
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {b}
                  </button>
                ))}
                {zonasFiltradas.length === 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    Sin resultados
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Property list */}
          <div ref={listRef} className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Building2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">
                  Sin resultados
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Probá cambiando los filtros
                </p>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              filtered.map((p) => {
                const isActive = activeId === p.id;
                return (
                  <button
                    key={p.id}
                    data-id={p.id}
                    onClick={() => setActiveId(p.id)}
                    className={`flex w-full gap-3 border-b border-border px-5 py-3.5 text-left transition ${
                      isActive
                        ? "border-l-2 border-l-[oklch(0.78_0.13_80)] bg-muted/50"
                        : "border-l-2 border-l-transparent hover:bg-muted/30"
                    }`}
                  >
                    <img
                      src={p.fotos[0]}
                      alt=""
                      className="h-16 w-20 flex-shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={`truncate text-sm font-bold ${
                          isActive ? "text-[oklch(0.78_0.13_80)]" : ""
                        }`}
                      >
                        {formatPriceFromProperty(p)}
                      </div>
                      <div className="truncate text-xs text-foreground/80">
                        {p.direccion}
                      </div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {p.barrio}, {p.ciudad}
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Bed className="h-3 w-3" />
                          {p.dormitorios}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="h-3 w-3" />
                          {p.banos}
                        </span>
                        <span className="flex items-center gap-1">
                          <Maximize2 className="h-3 w-3" />
                          {p.m2Totales}m&sup2;
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 z-[5] bg-black/30 md:hidden"
          />
        )}

        {/* Map */}
        <div ref={mapRef} className="z-0 flex-1" />
      </div>
    </div>
  );
}
