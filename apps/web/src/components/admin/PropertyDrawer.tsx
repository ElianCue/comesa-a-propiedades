"use client";

import { Component, useState, useEffect, useCallback } from "react";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import { type Ciudad, type PropertyType, type Operation, type Currency, type Amenity, type City } from "@/lib/properties";
import { api } from "@/lib/api-client";
import { X, Loader2 } from "lucide-react";

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-400">
          <strong>Error de render:</strong> {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

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
  expensas?: string;
  piso?: string;
  antiguedad?: string;
  descripcion: string;
  lat: number;
  lng: number;
  fotos: string[];
  amenities: string[];
  detalles?: Record<string, string>;
  activo: boolean;
  aptoBanco: boolean;
  permuta: boolean;
}

interface Props {
  property: PropertyData | null;
  onClose: () => void;
  onSaved: () => void;
}

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
      id: "", ciudad: "La Plata", barrio: "", tipo: "Casa",
      operacion: "Venta", moneda: "USD", direccion: "", precio: 0,
      m2Totales: 0, m2Cubiertos: 0, ambientes: 1, dormitorios: 1, banos: 1,
      descripcion: "", lat: -34.9215, lng: -57.9545,
      fotos: [], amenities: [], activo: true, aptoBanco: false, permuta: false,
      m2Terreno: undefined, m2Descubierta: undefined, cantPlantas: undefined, expensas: "",
      detalles: {}
    }
  );
  
  // Initialize form with property data if provided
  useEffect(() => {
    if (property) {
      // Flatten the grouped detalles format from the API to simple key-value pairs
      const flatDetalles: Record<string, string> = {};
      if (property.detalles) {
        for (const section of Object.values(property.detalles)) {
          if (Array.isArray(section)) {
            for (const item of section) {
              if (item.clave && item.valor !== undefined) {
                flatDetalles[item.clave] = item.valor;
              }
            }
          } else if (typeof section === 'string') {
            // Already in simple key-value format somehow
            Object.assign(flatDetalles, property.detalles);
            break;
          }
        }
      }
      setP({
        ...property,
        amenities: property.amenities || [],
        detalles: flatDetalles
      });
    }
  }, [property]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newDetalleKey, setNewDetalleKey] = useState("");
  const [newDetalleVal, setNewDetalleVal] = useState("");
  
  // Lookup data from API
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [barrios, setBarrios] = useState<string[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  
  const [loadingLookups, setLoadingLookups] = useState(true);

  // Fetch lookup data when component mounts or ciudad changes
  useEffect(() => {
    const loadLookups = async () => {
      setLoadingLookups(true);
      try {
        // Fetch all lookup data in parallel
        const [
          propertyTypesRes,
          amenitiesRes,
          citiesRes,
          operationsRes,
          currenciesRes
        ] = await Promise.all([
          api.get<PropertyType[]>("/api/lookup/property-types"),
          api.get<Amenity[]>("/api/lookup/amenities"),
          api.get<City[]>("/api/lookup/cities"),
          api.get<Operation[]>("/api/lookup/operations"),
          api.get<Currency[]>("/api/lookup/currencies")
        ]);
        
        setPropertyTypes(propertyTypesRes);
        setAmenities(amenitiesRes);
        setCities(citiesRes);
        setOperations(operationsRes);
        setCurrencies(currenciesRes);
        
        // Set initial barrios based on current ciudad
        if (p.ciudad) {
          const city = citiesRes.find((c: City) => c.nombre === p.ciudad);
          if (city) {
            const barriosRes = await api.get<any[]>(`/api/lookup/cities/${city.id}/barrios`);
            setBarrios(barriosRes.map((b: any) => b.nombre));
          }
        }
      } catch (err) {
        console.error("Failed to load lookup data:", err);
      } finally {
        setLoadingLookups(false);
      }
    };
    
    loadLookups();
  }, [p.ciudad]);

  const set = <K extends keyof PropertyData>(k: K, v: PropertyData[K]) =>
    setP((prev) => ({ ...prev, [k]: v }));

  const toggleAmenity = (name: string) => {
    setP((prev) => {
      const arr = Array.isArray(prev.amenities) ? prev.amenities : [];
      return {
        ...prev,
        amenities: arr.includes(name) ? arr.filter((a) => a !== name) : [...arr, name],
      };
    });
  };

   const submit = async (e: React.FormEvent) => {
     e.preventDefault();
     setSaving(true);
     setError(null);
     try {
       const body: Record<string, unknown> = {
         ciudad: p.ciudad || undefined,
         barrio: p.barrio || undefined,
         tipo: p.tipo || undefined,
         operacion: p.operacion || undefined,
         moneda: p.moneda || undefined,
         direccion: p.direccion || undefined,
         precio: p.precio || undefined,
         m2_totales: p.m2Totales || undefined,
         m2_cubiertos: p.m2Cubiertos || undefined,
         ambientes: p.ambientes || undefined,
         dormitorios: p.dormitorios || undefined,
         banos: p.banos || undefined,
         piso: p.piso || undefined,
         antiguedad: p.antiguedad || undefined,
         descripcion: p.descripcion || undefined,
         lat: p.lat,
         lng: p.lng,
         m2_terreno: p.m2Terreno || undefined,
         m2_descubierta: p.m2Descubierta || undefined,
         cant_plantas: p.cantPlantas || undefined,
         expensas: p.expensas || undefined,
         fotos: p.fotos.filter(Boolean),
         amenities: p.amenities,
         activo: p.activo,
         apto_banco: p.aptoBanco,
         permuta: p.permuta,
         detalles: p.detalles && Object.keys(p.detalles).length > 0 ? p.detalles : undefined
       };

       if (!p.id) {
         const required = ["ciudad", "barrio", "tipo", "operacion", "direccion", "descripcion"] as const;
         const missing = required.filter((k) => !body[k]);
         if (missing.length > 0) {
           setError(`Campos requeridos: ${missing.join(", ")}`);
           setSaving(false);
           return;
         }
       }

       if (p.id) {
         await api.put(`/api/properties/${p.id}`, body);
       } else {
         await api.post("/api/properties", body);
       }
       onSaved();
       onClose();
     } catch (e: any) {
       const errMsg = e.data?.errors
         ? e.data.errors.map((err: { field: string; message: string }) => `${err.field}: ${err.message}`).join("\n")
         : e.message || "Error al guardar";
       setError(errMsg);
     } finally {
       setSaving(false);
     }
   };

  return (
    <ErrorBoundary>
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
          <ErrorBoundary>
           <Section title="Ubicación">
             <div className="grid gap-4 md:grid-cols-2">
               <Field label="Ciudad">
                  <select 
                    value={p.ciudad} 
                    onChange={(e) => {
                      const nueva = e.target.value as string;
                      setP(prev => ({ 
                        ...prev, 
                       ciudad: nueva, 
                       barrio: "" 
                     }));
                      // Fetch barrios for the selected city
                      if (nueva) {
                        const city = cities.find((c: City) => c.nombre === nueva);
                        if (city) {
                          api.get<any[]>(`/api/lookup/cities/${city.id}/barrios`)
                            .then((res) => setBarrios(res.map((b: any) => b.nombre)))
                            .catch(() => setBarrios([]));
                        }
                      }
                    }}
                   disabled={loadingLookups}
                 >
                   <option value="">Seleccione una ciudad</option>
                   {cities.map((city) => (
                     <option key={city.id} value={city.nombre}>
                       {city.nombre}
                     </option>
                   ))}
                 </select>
               </Field>
               <Field label="Barrio">
                 <select 
                   value={p.barrio} 
                   onChange={(e) => set("barrio", e.target.value)}
                   disabled={loadingLookups || !p.ciudad}
                 >
                   <option value="">Seleccione un barrio</option>
                   {barrios.map((barrio) => (
                     <option key={barrio} value={barrio}>
                       {barrio}
                     </option>
                   ))}
                 </select>
               </Field>
               <Field label="Dirección" full>
                 <input 
                   value={p.direccion} 
                   onChange={(e) => set("direccion", e.target.value)} 
                   required
                 />
               </Field>
             </div>
           </Section>

           <Section title="Operación">
             <div className="grid gap-4 md:grid-cols-2">
               <Field label="Tipo">
                 <select 
                   value={p.tipo} 
                   onChange={(e) => set("tipo", e.target.value)}
                   disabled={loadingLookups || propertyTypes.length === 0}
                 >
                   <option value="">Seleccione un tipo</option>
                   {propertyTypes.map((type) => (
                     <option key={type.id} value={type.nombre}>
                       {type.nombre}
                     </option>
                   ))}
                 </select>
               </Field>
               <Field label="Operación">
                 <select 
                   value={p.operacion} 
                   onChange={(e) => set("operacion", e.target.value)}
                   disabled={loadingLookups || operations.length === 0}
                 >
                   <option value="">Seleccione una operación</option>
                   {operations.map((op) => (
                     <option key={op.id} value={op.nombre}>
                       {op.nombre}
                     </option>
                   ))}
                 </select>
               </Field>
               <Field label="Moneda">
                 <select 
                   value={p.moneda} 
                   onChange={(e) => set("moneda", e.target.value)}
                   disabled={loadingLookups || currencies.length === 0}
                 >
                   <option value="">Seleccione una moneda</option>
                   {currencies.map((curr) => (
                     <option key={curr.id} value={curr.codigo}>
                       {curr.codigo}
                     </option>
                   ))}
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
               <Field label="M² terreno">
                 <input 
                   type="number" 
                   value={p.m2Terreno || 0} 
                   onChange={(e) => {
                     const val = +e.target.value;
                     setP(prev => ({ ...prev, m2Terreno: val === 0 ? undefined : val }));
                   }}
                 />
               </Field>
               <Field label="M² descubierta">
                 <input 
                   type="number" 
                   value={p.m2Descubierta || 0} 
                   onChange={(e) => {
                     const val = +e.target.value;
                     setP(prev => ({ ...prev, m2Descubierta: val === 0 ? undefined : val }));
                   }}
                 />
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
               <Field label="Cant. plantas">
                 <input 
                   type="number" 
                   value={p.cantPlantas || 0} 
                   onChange={(e) => {
                     const val = +e.target.value;
                     setP(prev => ({ ...prev, cantPlantas: val === 0 ? undefined : val }));
                   }}
                 />
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
                <Field label="Expensas">
                  <input 
                    value={p.expensas || ""} 
                    onChange={(e) => set("expensas", e.target.value)} 
                  />
                </Field>
                <Field label="Descripción" full>
                  <textarea value={p.descripcion} onChange={(e) => set("descripcion", e.target.value)} rows={4} />
                </Field>
              </div>

              <div className="mt-6 border-t pt-6" style={{ borderColor: "oklch(0.18 0.005 285)" }}>
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: "oklch(0.5 0.01 285)" }}>
                  Características adicionales
                </div>
                {p.detalles && Object.entries(p.detalles).map(([key, val]) => (
                  <div key={key} className="mb-2 flex items-center gap-2">
                    <input
                      value={key}
                      onChange={(e) => {
                        const newDetalles = { ...p.detalles };
                        delete newDetalles[key];
                        newDetalles[e.target.value] = val;
                        setP({ ...p, detalles: newDetalles });
                      }}
                      className="flex-1 rounded-lg px-3 py-2 text-sm"
                      style={{ background: "oklch(0.14 0.005 285)", border: "1px solid oklch(0.22 0.005 285)" }}
                    />
                    <input
                      value={val}
                      onChange={(e) => setP({ ...p, detalles: { ...p.detalles, [key]: e.target.value } })}
                      className="flex-1 rounded-lg px-3 py-2 text-sm"
                      style={{ background: "oklch(0.14 0.005 285)", border: "1px solid oklch(0.22 0.005 285)" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newDetalles = { ...p.detalles };
                        delete newDetalles[key];
                        setP({ ...p, detalles: newDetalles });
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                      style={{ color: "oklch(0.5 0.01 285)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "oklch(0.18 0.005 285)"; e.currentTarget.style.color = "oklch(0.6 0.22 27)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "oklch(0.5 0.01 285)"; }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    value={newDetalleKey}
                    onChange={(e) => setNewDetalleKey(e.target.value)}
                    placeholder="Clave"
                    className="flex-1 rounded-lg px-3 py-2 text-sm"
                    style={{ background: "oklch(0.14 0.005 285)", border: "1px solid oklch(0.22 0.005 285)" }}
                  />
                  <input
                    value={newDetalleVal}
                    onChange={(e) => setNewDetalleVal(e.target.value)}
                    placeholder="Valor"
                    className="flex-1 rounded-lg px-3 py-2 text-sm"
                    style={{ background: "oklch(0.14 0.005 285)", border: "1px solid oklch(0.22 0.005 285)" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newDetalleKey.trim() && newDetalleVal.trim()) {
                        setP({ ...p, detalles: { ...p.detalles, [newDetalleKey.trim()]: newDetalleVal.trim() } });
                        setNewDetalleKey("");
                        setNewDetalleVal("");
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all"
                    style={{ background: "var(--gold)", color: "oklch(0.08 0.005 285)" }}
                    onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.filter = "none"}
                  >
                    +
                  </button>
                </div>
              </div>
            </Section>

            <Section title="Amenities">
              <ErrorBoundary>
              {loadingLookups ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity) => {
                      const active = p.amenities.includes(amenity.nombre);
                      return (
                        <button
                          key={amenity.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleAmenity(amenity.nombre)}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all"
                          style={{
                            background: active ? "var(--gold-dim)" : "oklch(0.14 0.005 285)",
                            outline: active ? "1px solid var(--gold)" : "1px solid oklch(0.22 0.005 285)",
                          }}
                        >
                          <div
                            className="flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold transition-all"
                            style={{
                              background: active ? "var(--gold)" : "oklch(0.22 0.005 285)",
                              color: active ? "oklch(0.08 0.005 285)" : "transparent",
                            }}
                          >
                            {active ? "✓" : ""}
                          </div>
                          <div className="ml-2">{amenity.nombre}</div>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="text-[10px] text-[oklch(0.5 0.01 285)]">
                    {p.amenities.length} amenit{p.amenities.length !== 1 ? "ies" : "y"} seleccionada{p.amenities.length !== 1 ? "s" : ""}
                  </div>
                </div>
              )}
              </ErrorBoundary>
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
          </ErrorBoundary>
        </div>

        {error && (
          <div className="px-6 py-3 text-sm text-red-400 bg-red-950/30 border-t border-red-900/50" style={{ whiteSpace: "pre-line" }}>
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
    </ErrorBoundary>
  );
}
