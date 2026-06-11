"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { PropertyDrawer } from "@/components/admin/PropertyDrawer";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { api } from "@/lib/api-client";
import { ExternalLink, Pencil, Trash2, Plus, Loader2, Search, SlidersHorizontal, RotateCcw, QrCode, FileText } from "lucide-react";
import { createPropertySlug } from "@/lib/properties";
import { generateQRPDF, generateCartelPDF } from "@/lib/pdf";

interface PropertyData {
  id: string;
  ciudad: string;
  barrio: string;
  tipo: string;
  operacion: string;
  moneda: string;
  direccion: string;
  precio: number;
  m2Totales: number;
  m2Cubiertos: number;
  m2Terreno?: number;
  m2Descubierta?: number;
  ambientes: number;
  dormitorios: number;
  banos: number;
  cantPlantas?: number;
  piso?: string;
  antiguedad?: string;
  expensas?: string;
  descripcion: string;
  lat: number;
  lng: number;
  fotos: string[];
  amenities: string[];
  activo: boolean;
  aptoBanco: boolean;
  permuta: boolean;
  cochera: boolean;
  balcon: boolean;
  jardin: boolean;
  parrilla: boolean;
  pileta: boolean;
}

export default function AdminProperties() {
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [drawer, setDrawer] = useState<PropertyData | "new" | null>(null);
  const [loadKey, setLoadKey] = useState(0);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Filters
  const [fCiudad, setFCiudad] = useState("");
  const [fOperacion, setFOperacion] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [fEstado, setFEstado] = useState<"" | "activo" | "inactivo">("");
  const [fSearch, setFSearch] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<any>("/api/properties?limit=200");
      setProperties(res);
    } catch {
      setProperties([]);
    }
  }, []);

  useEffect(() => { load(); }, [loadKey]);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (fCiudad && p.ciudad !== fCiudad) return false;
      if (fOperacion && p.operacion !== fOperacion) return false;
      if (fTipo && p.tipo !== fTipo) return false;
      if (fEstado === "activo" && !p.activo) return false;
      if (fEstado === "inactivo" && p.activo) return false;
      if (fSearch) {
        const q = fSearch.toLowerCase();
        if (!p.direccion.toLowerCase().includes(q) && !p.barrio.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [properties, fCiudad, fOperacion, fTipo, fEstado, fSearch]);

  const tipos = useMemo(() => [...new Set(properties.map((p) => p.tipo))], [properties]);
  const ciudades = useMemo(() => [...new Set(properties.map((p) => p.ciudad))], [properties]);

  const activeFilterCount = [fCiudad, fOperacion, fTipo, fEstado].filter(Boolean).length + (fSearch ? 1 : 0);

  const clearFilters = () => {
    setFCiudad("");
    setFOperacion("");
    setFTipo("");
    setFEstado("");
    setFSearch("");
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeletingLoading(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/properties/${confirmDeleteId}`);
      setLoadKey((k) => k + 1);
      setDeleteSuccess(true);
      setTimeout(() => {
        setConfirmDeleteOpen(false);
        setConfirmDeleteId(null);
        setDeleteSuccess(false);
        setDeletingLoading(false);
      }, 1500);
    } catch (e: any) {
      setDeleteError(e.message || "Error al eliminar");
      setDeletingLoading(false);
    } finally {
      setTimeout(() => {
        setConfirmDeleteOpen(false);
        setConfirmDeleteId(null);
      }, 2000);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
    setConfirmDeleteId(null);
    setDeleteError(null);
    setDeleteSuccess(false);
    setDeletingLoading(false);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-display text-2xl font-bold tracking-tight lg:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Propiedades
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--admin-text-muted)" }}>
            {filtered.length} de {properties.length} propiedades
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all"
            style={{
              borderColor: showFilters ? "var(--gold)" : "var(--admin-input-border)",
              color: showFilters ? "var(--gold)" : "var(--admin-text-muted)",
              background: showFilters ? "var(--gold-dim)" : "transparent",
            }}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: "var(--gold)" }}>
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setDrawer("new")}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all"
            style={{ background: "var(--gold)" }}
            onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.1)"}
            onMouseLeave={(e) => e.currentTarget.style.filter = "none"}
          >
            <Plus className="h-4 w-4" />
            Nueva
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div
          className="mt-6 rounded-xl border p-5 animate-fade-in"
          style={{ borderColor: "var(--admin-border)", background: "var(--admin-surface)" }}
        >
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-muted)" }}>Ciudad</div>
              <select
                value={fCiudad}
                onChange={(e) => setFCiudad(e.target.value)}
                className="rounded-lg border px-3 py-2 text-xs"
                style={{ background: "var(--admin-surface-hover)", borderColor: "var(--admin-input-border)", color: "var(--admin-text)", minWidth: "140px" }}
              >
                <option value="">Todas</option>
                {ciudades.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-muted)" }}>Operación</div>
              <select
                value={fOperacion}
                onChange={(e) => setFOperacion(e.target.value)}
                className="rounded-lg border px-3 py-2 text-xs"
                style={{ background: "var(--admin-surface-hover)", borderColor: "var(--admin-input-border)", color: "var(--admin-text)", minWidth: "120px" }}
              >
                <option value="">Todas</option>
                <option value="Venta">Venta</option>
                <option value="Alquiler">Alquiler</option>
              </select>
            </div>
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-muted)" }}>Tipo</div>
              <select
                value={fTipo}
                onChange={(e) => setFTipo(e.target.value)}
                className="rounded-lg border px-3 py-2 text-xs"
                style={{ background: "var(--admin-surface-hover)", borderColor: "var(--admin-input-border)", color: "var(--admin-text)", minWidth: "120px" }}
              >
                <option value="">Todos</option>
                {tipos.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-muted)" }}>Estado</div>
              <select
                value={fEstado}
                onChange={(e) => setFEstado(e.target.value as "" | "activo" | "inactivo")}
                className="rounded-lg border px-3 py-2 text-xs"
                style={{ background: "var(--admin-surface-hover)", borderColor: "var(--admin-input-border)", color: "var(--admin-text)", minWidth: "120px" }}
              >
                <option value="">Todos</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--admin-text-muted)" }}>Buscar</div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--admin-text-muted)" }} />
                <input
                  value={fSearch}
                  onChange={(e) => setFSearch(e.target.value)}
                  placeholder="Dirección o barrio..."
                  className="w-full rounded-lg border py-2 pl-9 pr-3 text-xs"
                  style={{ background: "var(--admin-surface-hover)", borderColor: "var(--admin-input-border)", color: "var(--admin-text)" }}
                />
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                style={{ color: "var(--admin-text-muted)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--admin-text)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--admin-text-muted)"}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div
        className="mt-6 overflow-x-auto rounded-xl border"
        style={{ borderColor: "var(--admin-border)" }}
      >
        <table className="w-full text-sm" style={{ minWidth: "640px" }}>
          <thead>
            <tr style={{ background: "var(--admin-bg)" }}>
              {["Foto", "Dirección", "Ciudad", "Tipo", "Operación", "Precio", "Estado", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em]"
                  style={{ color: "var(--admin-text-dim)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr
                key={p.id}
                className="animate-fade-in border-t transition-all"
                style={{
                  animationDelay: `${0.3 + i * 0.03}s`,
                  borderColor: "var(--admin-border)",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--admin-surface-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <td className="px-4 py-3">
                  <div
                    className="h-10 w-14 overflow-hidden rounded-lg"
                    style={{ background: "var(--admin-surface-hover)" }}
                  >
                    {p.fotos[0] && (
                      <img
                        src={p.fotos[0]}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300"
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{p.direccion}</div>
                  <div className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{p.barrio}</div>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--admin-text-muted)" }}>{p.ciudad}</td>
                <td className="px-4 py-3">{p.tipo}</td>
                <td className="px-4 py-3">{p.operacion}</td>
                <td className="px-4 py-3 font-semibold" style={{ color: "var(--gold)" }}>
                  {new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0 }).format(p.precio)}{" "}
                  {p.moneda === "USD" ? "USD" : "ARS"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: p.activo ? "var(--admin-active-bg)" : "var(--admin-surface-active)",
                      color: p.activo ? "var(--admin-active-text)" : "var(--admin-text-dim)",
                    }}
                  >
                    {p.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <a
                      href={`/propiedad/${createPropertySlug(p as any)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ver en la web"
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                      style={{ color: "var(--admin-text-muted)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--admin-border)";
                        e.currentTarget.style.color = "var(--gold)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--admin-text-muted)";
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => generateQRPDF(p as any)}
                      title="Descargar QR"
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                      style={{ color: "var(--admin-text-muted)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--admin-border)";
                        e.currentTarget.style.color = "var(--gold)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--admin-text-muted)";
                      }}
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => generateCartelPDF(p as any)}
                      title="Descargar cartel"
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                      style={{ color: "var(--admin-text-muted)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--admin-border)";
                        e.currentTarget.style.color = "var(--gold)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--admin-text-muted)";
                      }}
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDrawer(p)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                      style={{ color: "var(--admin-text-muted)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--admin-border)";
                        e.currentTarget.style.color = "var(--gold)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--admin-text-muted)";
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingLoading}
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                      style={{ color: "var(--admin-text-muted)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--admin-border)";
                        e.currentTarget.style.color = "var(--admin-destructive)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--admin-text-muted)";
                      }}
                    >
                      {deletingLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!filtered.length && (
          <div className="flex items-center justify-center py-20 text-sm" style={{ color: "var(--admin-text-dim)" }}>
            {properties.length === 0 ? "No hay propiedades cargadas" : "Sin resultados para los filtros seleccionados"}
          </div>
        )}
      </div>

      {drawer && (
        <PropertyDrawer
          property={drawer === "new" ? null : drawer}
          onClose={() => setDrawer(null)}
          onSaved={() => setLoadKey((k) => k + 1)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="¿Eliminar propiedad?"
        description="Esta acción no se puede deshacer. ¿Está seguro de que desea eliminar esta propiedad?"
        onConfirm={handleConfirmDelete}
        loading={deletingLoading}
        successMessage="Propiedad eliminada correctamente"
      />
    </>
  );
}
