"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { usePropertyStore } from "@/lib/store";
import {
  CIUDADES,
  getBarrios,
  formatPrice,
  type Property,
  type Moneda,
  type Operacion,
  type Tipo,
  type Ciudad,
} from "@/lib/properties";
import { Pencil, Trash2, Plus, LogOut } from "lucide-react";

const AUTH_KEY = "comesana.auth";
const USER = "admin";
const PASS = "comesana2025";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [u, setU] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setAuthed(localStorage.getItem(AUTH_KEY) === "1");
  }, []);

  if (!authed) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto mt-20 max-w-sm rounded-2xl border border-border bg-card p-8">
          <h1 className="font-display text-2xl font-semibold">Panel Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acceso restringido</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (u === USER && pw === PASS) {
                localStorage.setItem(AUTH_KEY, "1");
                setAuthed(true);
              } else setErr("Credenciales inválidas");
            }}
            className="mt-6 space-y-3"
          >
            <input
              value={u}
              onChange={(e) => setU(e.target.value)}
              placeholder="Usuario"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
            />
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Contraseña"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
            />
            {err && <div className="text-xs text-destructive">{err}</div>}
            <button className="w-full rounded-lg bg-foreground py-2.5 text-sm font-semibold text-background">
              Ingresar
            </button>
            <div className="text-center text-[10px] text-muted-foreground">
              Demo: admin / comesana2025
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      onLogout={() => {
        localStorage.removeItem(AUTH_KEY);
        setAuthed(false);
      }}
    />
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const { properties, deleteProperty, addProperty, updateProperty, loadProperties } =
    usePropertyStore();
  const [editing, setEditing] = useState<Property | null>(null);

  useEffect(() => {
    loadProperties();
  }, []);

  const stats = {
    total: properties.length,
    activas: properties.filter((p) => p.activo).length,
    venta: properties.filter((p) => p.operacion === "Venta").length,
    alquiler: properties.filter((p) => p.operacion === "Alquiler").length,
  };

  const del = (id: string) => {
    if (!confirm("¿Eliminar propiedad?")) return;
    deleteProperty(id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold">
              Panel de Administración
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gestión de propiedades
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(blank())}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
            >
              <Plus className="h-4 w-4" />
              Nueva propiedad
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "Total", v: stats.total, c: "text-accent" },
            { l: "Activas", v: stats.activas, c: "text-stat-green" },
            { l: "En Venta", v: stats.venta, c: "text-accent" },
            { l: "En Alquiler", v: stats.alquiler, c: "text-stat-orange" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                {s.l}
              </div>
              <div className={`mt-2 font-display text-4xl font-bold ${s.c}`}>
                {s.v}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3">Foto</th>
                <th className="p-3">Dirección</th>
                <th className="p-3">Ciudad</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Operación</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3">
                    <img
                      src={p.fotos[0]}
                      className="h-12 w-16 rounded object-cover"
                      alt=""
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{p.direccion}</div>
                    <div className="text-xs text-muted-foreground">{p.barrio}</div>
                  </td>
                  <td className="p-3 text-xs">{p.ciudad ?? "La Plata"}</td>
                  <td className="p-3">{p.tipo}</td>
                  <td className="p-3">{p.operacion}</td>
                  <td className="p-3 font-semibold">{formatPrice(p)}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        p.activo
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {p.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setEditing(p)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-muted"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => del(p.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded text-destructive hover:bg-muted"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <PropertyForm
          property={editing}
          onClose={() => setEditing(null)}
          onSave={(prop) => {
            const exists = properties.find((p) => p.id === prop.id);
            if (exists) {
              updateProperty(prop);
            } else {
              addProperty(prop);
            }
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function blank(): Property {
  return {
    id: crypto.randomUUID(),
    ciudad: "La Plata",
    operacion: "Venta",
    tipo: "Casa",
    direccion: "",
    barrio: "Centro",
    precio: 0,
    moneda: "USD",
    m2Totales: 0,
    m2Cubiertos: 0,
    ambientes: 1,
    dormitorios: 1,
    banos: 1,
    cochera: false,
    balcon: false,
    jardin: false,
    parrilla: false,
    pileta: false,
    descripcion: "",
    lat: -34.9215,
    lng: -57.9545,
    fotos: [""],
    activo: true,
  };
}

function PropertyForm({
  property,
  onClose,
  onSave,
}: {
  property: Property;
  onClose: () => void;
  onSave: (prop: Property) => void;
}) {
  const [p, setP] = useState<Property>(property);
  const set = <K extends keyof Property>(k: K, v: Property[K]) =>
    setP({ ...p, [k]: v });

  const barriosDisponibles = getBarrios(p.ciudad);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = { ...p, fotos: p.fotos.filter(Boolean) };
    if (cleaned.fotos.length === 0)
      cleaned.fotos = [
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
      ];
    onSave(cleaned);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4">
      <form
        onSubmit={submit}
        className="my-8 w-full max-w-3xl rounded-2xl bg-background p-8"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">
            {property.direccion ? "Editar propiedad" : "Nueva propiedad"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Ciudad">
            <select
              value={p.ciudad}
              onChange={(e) => {
                const nueva = e.target.value as Ciudad;
                set("ciudad", nueva);
                setP((prev) => ({ ...prev, ciudad: nueva, barrio: getBarrios(nueva)[0] }));
              }}
              className="input"
            >
              {CIUDADES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Operación">
            <select
              value={p.operacion}
              onChange={(e) => set("operacion", e.target.value as Operacion)}
              className="input"
            >
              <option>Venta</option>
              <option>Alquiler</option>
            </select>
          </Field>
          <Field label="Tipo">
            <select
              value={p.tipo}
              onChange={(e) => set("tipo", e.target.value as Tipo)}
              className="input"
            >
              <option>Casa</option>
              <option>Depto</option>
              <option>PH</option>
              <option>Local</option>
              <option>Terreno</option>
            </select>
          </Field>
          <Field label="Dirección" full>
            <input
              value={p.direccion}
              onChange={(e) => set("direccion", e.target.value)}
              className="input"
              required
            />
          </Field>
          <Field label="Barrio">
            <select
              value={p.barrio}
              onChange={(e) => set("barrio", e.target.value)}
              className="input"
            >
              {barriosDisponibles.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>
          <Field label="Moneda">
            <select
              value={p.moneda}
              onChange={(e) => set("moneda", e.target.value as Moneda)}
              className="input"
            >
              <option>USD</option>
              <option>ARS</option>
            </select>
          </Field>
          <Field label="Precio">
            <input
              type="number"
              value={p.precio}
              onChange={(e) => set("precio", +e.target.value)}
              className="input"
            />
          </Field>
          <Field label="M² totales">
            <input
              type="number"
              value={p.m2Totales}
              onChange={(e) => set("m2Totales", +e.target.value)}
              className="input"
            />
          </Field>
          <Field label="M² cubiertos">
            <input
              type="number"
              value={p.m2Cubiertos}
              onChange={(e) => set("m2Cubiertos", +e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Ambientes">
            <input
              type="number"
              value={p.ambientes}
              onChange={(e) => set("ambientes", +e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Dormitorios">
            <input
              type="number"
              value={p.dormitorios}
              onChange={(e) => set("dormitorios", +e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Baños">
            <input
              type="number"
              value={p.banos}
              onChange={(e) => set("banos", +e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Latitud">
            <input
              type="number"
              step="0.0001"
              value={p.lat}
              onChange={(e) => set("lat", +e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Longitud">
            <input
              type="number"
              step="0.0001"
              value={p.lng}
              onChange={(e) => set("lng", +e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {(["cochera", "balcon", "jardin", "parrilla", "pileta"] as const).map(
            (k) => (
              <label
                key={k}
                className="flex items-center gap-2 text-sm capitalize"
              >
                <input
                  type="checkbox"
                  checked={p[k]}
                  onChange={(e) => set(k, e.target.checked)}
                />
                {k}
              </label>
            )
          )}
        </div>

        <Field label="Descripción" full>
          <textarea
            value={p.descripcion}
            onChange={(e) => set("descripcion", e.target.value)}
            rows={4}
            className="input"
          />
        </Field>

        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Fotos (URLs · hasta 6)
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <input
              key={i}
              value={p.fotos[i] || ""}
              onChange={(e) => {
                const f = [...p.fotos];
                f[i] = e.target.value;
                set("fotos", f);
              }}
              placeholder={`URL foto ${i + 1}`}
              className="input mb-2"
            />
          ))}
        </div>

        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={p.activo}
            onChange={(e) => set("activo", e.target.checked)}
          />
          Propiedad activa
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2.5 text-sm"
          >
            Cancelar
          </button>
          <button className="rounded-lg bg-foreground px-6 py-2.5 text-sm font-semibold text-background">
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}
