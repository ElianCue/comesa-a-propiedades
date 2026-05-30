"use client";

import { useState } from "react";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import { CIUDADES, getBarrios, type Ciudad } from "@/lib/properties";
import { api } from "@/lib/api-client";
import { X, Loader2 } from "lucide-react";

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

interface Props {
  property: PropertyData | null;
  onClose: () => void;
  onSaved: () => void;
}

const AMENITIES_LIST = ["Cochera", "Balcón", "Jardín", "Parrilla", "Pileta"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em]"
        style={{ color: "oklch(0.5 0.01 285)" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <div className="mb-1.5 text-[11px] font-medium" style={{ color: "oklch(0.6 0.01 285)" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

export function PropertyDrawer({ property, onClose, onSaved }: Props) {
  const [p, setP] = useState<PropertyData>(
    property || {
      id: "", ciudad: "La Plata", barrio: "Centro", tipo: "Casa",
      operacion: "Venta", moneda: "USD", direccion: "", precio: 0,
      m2Totales: 0, m2Cubiertos: 0, ambientes: 1, dormitorios: 1, banos: 1,
      descripcion: "", lat: -34.9215, lng: -57.9545,
      fotos: [], amenities: [], activo: true, aptoBanco: false, permuta: false,
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const barriosDisponibles = getBarrios(p.ciudad as Ciudad);

  const set = <K extends keyof PropertyData>(k: K, v: PropertyData[K]) =>
    setP({ ...p, [k]: v });

  const toggleAmenity = (name: string) => {
    setP({
      ...p,
      amenities: p.amenities.includes(name)
        ? p.amenities.filter((a) => a !== name)
        : [...p.amenities, name],
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        ciudad: p.ciudad,
        barrio: p.barrio,
        tipo: p.tipo,
        operacion: p.operacion,
        moneda: p.moneda,
        direccion: p.direccion,
        precio: p.precio,
        m2_totales: p.m2Totales,
        m2_cubiertos: p.m2Cubiertos,
        ambientes: p.ambientes,
        dormitorios: p.dormitorios,
        banos: p.banos,
        piso: p.piso,
        antiguedad: p.antiguedad,
        descripcion: p.descripcion,
        lat: p.lat,
        lng: p.lng,
        fotos: p.fotos.filter(Boolean),
        amenities: p.amenities,
        activo: p.activo,
        apto_banco: p.aptoBanco,
        permuta: p.permuta,
      };

      if (p.id) {
        await api.put(`/api/properties/${p.id}`, body);
      } else {
        await api.post("/api/properties", body);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={onClose}
      />
      <form
        onSubmit={submit}
        className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden"
        style={{
          background: "oklch(0.1 0.005 285)",
          borderLeft: "1px solid oklch(0.18 0.005 285)",
          animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: "oklch(0.18 0.005 285)" }}
        >
          <h2
            className="font-display text-lg font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {p.id ? "Editar propiedad" : "Nueva propiedad"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ color: "oklch(0.5 0.01 285)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "oklch(0.18 0.005 285)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 admin-scrollbar">
          <Section title="Ubicación">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Ciudad">
                <select value={p.ciudad} onChange={(e) => {
                  const nueva = e.target.value as Ciudad;
                  setP({ ...p, ciudad: nueva, barrio: getBarrios(nueva)[0] });
                }}>
                  {CIUDADES.map((c) => (<option key={c}>{c}</option>))}
                </select>
              </Field>
              <Field label="Barrio">
                <select value={p.barrio} onChange={(e) => set("barrio", e.target.value)}>
                  {barriosDisponibles.map((b) => (<option key={b}>{b}</option>))}
                </select>
              </Field>
              <Field label="Dirección" full>
                <input value={p.direccion} onChange={(e) => set("direccion", e.target.value)} required />
              </Field>
            </div>
          </Section>

          <Section title="Operación">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tipo">
                <select value={p.tipo} onChange={(e) => set("tipo", e.target.value)}>
                  <option>Casa</option><option>Depto</option><option>PH</option>
                  <option>Local</option><option>Terreno</option>
                </select>
              </Field>
              <Field label="Operación">
                <select value={p.operacion} onChange={(e) => set("operacion", e.target.value)}>
                  <option>Venta</option><option>Alquiler</option>
                </select>
              </Field>
              <Field label="Moneda">
                <select value={p.moneda} onChange={(e) => set("moneda", e.target.value)}>
                  <option>USD</option><option>ARS</option>
                </select>
              </Field>
              <Field label="Precio">
                <input type="number" value={p.precio} onChange={(e) => set("precio", +e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Dimensiones">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="M² totales">
                <input type="number" value={p.m2Totales} onChange={(e) => set("m2Totales", +e.target.value)} />
              </Field>
              <Field label="M² cubiertos">
                <input type="number" value={p.m2Cubiertos} onChange={(e) => set("m2Cubiertos", +e.target.value)} />
              </Field>
              <Field label="Ambientes">
                <input type="number" value={p.ambientes} onChange={(e) => set("ambientes", +e.target.value)} />
              </Field>
              <Field label="Dormitorios">
                <input type="number" value={p.dormitorios} onChange={(e) => set("dormitorios", +e.target.value)} />
              </Field>
              <Field label="Baños">
                <input type="number" value={p.banos} onChange={(e) => set("banos", +e.target.value)} />
              </Field>
              <Field label="Latitud">
                <input type="number" step="0.0001" value={p.lat} onChange={(e) => set("lat", +e.target.value)} />
              </Field>
              <Field label="Longitud">
                <input type="number" step="0.0001" value={p.lng} onChange={(e) => set("lng", +e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Detalles">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Piso">
                <input value={p.piso || ""} onChange={(e) => set("piso", e.target.value)} />
              </Field>
              <Field label="Antigüedad">
                <input value={p.antiguedad || ""} onChange={(e) => set("antiguedad", e.target.value)} />
              </Field>
              <Field label="Descripción" full>
                <textarea value={p.descripcion} onChange={(e) => set("descripcion", e.target.value)} rows={4} />
              </Field>
            </div>
          </Section>

          <Section title="Amenities">
            <div className="flex flex-wrap gap-2">
              {AMENITIES_LIST.map((name) => (
                <label
                  key={name}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all"
                  style={{
                    background: p.amenities.includes(name) ? "var(--gold-dim)" : "oklch(0.14 0.005 285)",
                    outline: p.amenities.includes(name) ? "1px solid var(--gold)" : "1px solid oklch(0.22 0.005 285)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={p.amenities.includes(name)}
                    onChange={() => toggleAmenity(name)}
                    className="sr-only"
                  />
                  <div
                    className="flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold transition-all"
                    style={{
                      background: p.amenities.includes(name) ? "var(--gold)" : "oklch(0.22 0.005 285)",
                      color: p.amenities.includes(name) ? "oklch(0.08 0.005 285)" : "transparent",
                    }}
                  >
                    {p.amenities.includes(name) ? "✓" : ""}
                  </div>
                  {name}
                </label>
              ))}
            </div>
          </Section>

          <Section title="Fotos">
            <CloudinaryUploader images={p.fotos} onChange={(fotos) => set("fotos", fotos)} />
          </Section>

          <div className="space-y-3">
            <label className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm" style={{ background: "oklch(0.14 0.005 285)" }}>
              <input
                type="checkbox"
                checked={p.activo}
                onChange={(e) => set("activo", e.target.checked)}
                className="sr-only"
              />
              <div
                className="flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                style={{
                  background: p.activo ? "var(--gold)" : "oklch(0.25 0.01 285)",
                  padding: "2px",
                }}
              >
                <div
                  className="h-4 w-4 rounded-full transition-transform"
                  style={{
                    background: "oklch(0.98 0 0)",
                    transform: p.activo ? "translateX(16px)" : "translateX(0)",
                  }}
                />
              </div>
              Propiedad activa
            </label>
            <label className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm" style={{ background: "oklch(0.14 0.005 285)" }}>
              <input
                type="checkbox"
                checked={p.aptoBanco}
                onChange={(e) => set("aptoBanco", e.target.checked)}
                className="sr-only"
              />
              <div
                className="flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                style={{
                  background: p.aptoBanco ? "var(--gold)" : "oklch(0.25 0.01 285)",
                  padding: "2px",
                }}
              >
                <div
                  className="h-4 w-4 rounded-full transition-transform"
                  style={{
                    background: "oklch(0.98 0 0)",
                    transform: p.aptoBanco ? "translateX(16px)" : "translateX(0)",
                  }}
                />
              </div>
              Apto banco
            </label>
            <label className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm" style={{ background: "oklch(0.14 0.005 285)" }}>
              <input
                type="checkbox"
                checked={p.permuta}
                onChange={(e) => set("permuta", e.target.checked)}
                className="sr-only"
              />
              <div
                className="flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                style={{
                  background: p.permuta ? "var(--gold)" : "oklch(0.25 0.01 285)",
                  padding: "2px",
                }}
              >
                <div
                  className="h-4 w-4 rounded-full transition-transform"
                  style={{
                    background: "oklch(0.98 0 0)",
                    transform: p.permuta ? "translateX(16px)" : "translateX(0)",
                  }}
                />
              </div>
              Acepta permuta
            </label>
          </div>
        </div>

        {error && (
          <div className="px-6 py-3 text-sm text-red-400 bg-red-950/30 border-t border-red-900/50">
            {error}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 border-t px-6 py-4"
          style={{ borderColor: "oklch(0.18 0.005 285)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
            style={{ background: "oklch(0.14 0.005 285)", color: "oklch(0.6 0.01 285)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "oklch(0.18 0.005 285)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "oklch(0.14 0.005 285)"}
          >
            Cancelar
          </button>
          <button
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: "var(--gold)", color: "oklch(0.08 0.005 285)" }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.filter = "brightness(1.1)"; }}
            onMouseLeave={(e) => { if (!saving) e.currentTarget.style.filter = "none"; }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
