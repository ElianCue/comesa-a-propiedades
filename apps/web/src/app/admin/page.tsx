"use client";

import { useEffect, useState, useCallback } from "react";
import { PropertyDrawer } from "@/components/admin/PropertyDrawer";
import { api } from "@/lib/api-client";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";

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
  ambientes: number;
  dormitorios: number;
  banos: number;
  piso?: string;
  antiguedad?: string;
  descripcion: string;
  lat: number;
  lng: number;
  fotos: string[];
  amenities: string[];
  activo: boolean;
  aptoBanco: boolean;
  permuta: boolean;
}

export default function AdminProperties() {
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [drawer, setDrawer] = useState<PropertyData | "new" | null>(null);
  const [loadKey, setLoadKey] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<any>("/api/properties?limit=50");
      setProperties(res);
    } catch {
      setProperties([]);
    }
  }, []);

  useEffect(() => { load(); }, [loadKey]);

  const stats = {
    total: properties.length,
    activas: properties.filter((p) => p.activo).length,
    venta: properties.filter((p) => p.operacion === "Venta").length,
    alquiler: properties.filter((p) => p.operacion === "Alquiler").length,
  };

  const del = async (id: string) => {
    if (!confirm("¿Eliminar propiedad?")) return;
    setDeleting(id);
    try {
      await api.delete(`/api/properties/${id}`);
      setLoadKey((k) => k + 1);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const statCards = [
    { label: "Total", value: stats.total },
    { label: "Activas", value: stats.activas },
    { label: "En venta", value: stats.venta },
    { label: "En alquiler", value: stats.alquiler },
  ];

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
          <p className="mt-1 text-sm" style={{ color: "oklch(0.5 0.01 285)" }}>
            {properties.length} propiedades cargadas
          </p>
        </div>
        <button
          onClick={() => setDrawer("new")}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all"
          style={{ background: "var(--gold)", color: "oklch(0.08 0.005 285)" }}
          onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.1)"}
          onMouseLeave={(e) => e.currentTarget.style.filter = "none"}
        >
          <Plus className="h-4 w-4" />
          Nueva
        </button>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s, i) => (
          <div
            key={s.label}
            className="animate-slide-up rounded-xl border p-5 transition-all"
            style={{
              animationDelay: `${0.1 + i * 0.08}s`,
              background: "oklch(0.12 0.005 285)",
              borderColor: "oklch(0.18 0.005 285)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--gold)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "oklch(0.18 0.005 285)";
              e.currentTarget.style.transform = "none";
            }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: "oklch(0.5 0.01 285)" }}>
              {s.label}
            </div>
            <div
              className="mt-2 font-display text-4xl font-bold tracking-tight"
              style={{ color: "var(--gold)", fontFamily: "var(--font-display)" }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        className="mt-8 overflow-x-auto rounded-xl border"
        style={{ borderColor: "oklch(0.18 0.005 285)" }}
      >
        <table className="w-full text-sm" style={{ minWidth: "640px" }}>
          <thead>
            <tr style={{ background: "oklch(0.06 0.005 285)" }}>
              {["Foto", "Dirección", "Ciudad", "Tipo", "Operación", "Precio", "Estado", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em]"
                  style={{ color: "oklch(0.45 0.01 285)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {properties.map((p, i) => (
              <tr
                key={p.id}
                className="animate-fade-in border-t transition-all"
                style={{
                  animationDelay: `${0.3 + i * 0.03}s`,
                  borderColor: "oklch(0.18 0.005 285)",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "oklch(0.14 0.005 285)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <td className="px-4 py-3">
                  <div
                    className="h-10 w-14 overflow-hidden rounded-lg"
                    style={{ background: "oklch(0.14 0.005 285)" }}
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
                  <div className="text-xs" style={{ color: "oklch(0.5 0.01 285)" }}>{p.barrio}</div>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "oklch(0.6 0.01 285)" }}>{p.ciudad}</td>
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
                      background: p.activo ? "oklch(0.15 0.1 150 / 0.2)" : "oklch(0.2 0.01 285)",
                      color: p.activo ? "oklch(0.6 0.15 150)" : "oklch(0.45 0.01 285)",
                    }}
                  >
                    {p.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setDrawer(p)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                      style={{ color: "oklch(0.5 0.01 285)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "oklch(0.18 0.005 285)";
                        e.currentTarget.style.color = "var(--gold)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "oklch(0.5 0.01 285)";
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => del(p.id)}
                      disabled={deleting === p.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                      style={{ color: "oklch(0.5 0.01 285)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "oklch(0.18 0.005 285)";
                        e.currentTarget.style.color = "oklch(0.6 0.22 27)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "oklch(0.5 0.01 285)";
                      }}
                    >
                      {deleting === p.id ? (
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

        {!properties.length && (
          <div className="flex items-center justify-center py-20 text-sm" style={{ color: "oklch(0.45 0.01 285)" }}>
            No hay propiedades cargadas
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
    </>
  );
}
