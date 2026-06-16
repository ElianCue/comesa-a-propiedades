"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Loader2, MapPin, Check, X } from "lucide-react";

interface City {
  id: string;
  nombre: string;
  slug: string;
  barrios?: Barrio[];
}

interface Barrio {
  id: string;
  nombre: string;
  city_id: string;
}

export default function UbicacionesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingCity, setEditingCity] = useState<string | null>(null);
  const [editingBarrio, setEditingBarrio] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newCityOpen, setNewCityOpen] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [newBarrioFor, setNewBarrioFor] = useState<string | null>(null);
  const [newBarrioName, setNewBarrioName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const citiesData = await api.get<City[]>("/api/lookup/cities");
      const citiesWithBarrios = await Promise.all(
        (citiesData ?? []).map(async (c: City) => {
          const barrios = await api.get<Barrio[]>(`/api/lookup/cities/${c.id}/barrios`);
          return { ...c, barrios: barrios ?? [] };
        })
      );
      setCities(citiesWithBarrios);
    } catch {
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateCity = async () => {
    if (!newCityName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/lookup/cities", { nombre: newCityName.trim() });
      setNewCityName("");
      setNewCityOpen(false);
      await load();
    } catch (e: any) {
      setError(e.message || "Error al crear ciudad");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateCity = async (id: string) => {
    if (!editValue.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.put(`/api/lookup/cities/${id}`, { nombre: editValue.trim() });
      setEditingCity(null);
      setEditValue("");
      await load();
    } catch (e: any) {
      setError(e.message || "Error al actualizar ciudad");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCity = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar la ciudad "${nombre}" y todos sus barrios?`)) return;
    setBusy(true);
    setError(null);
    try {
      await api.delete(`/api/lookup/cities/${id}`);
      await load();
    } catch (e: any) {
      setError(e.message || "Error al eliminar ciudad");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateBarrio = async (cityId: string) => {
    if (!newBarrioName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.post(`/api/lookup/cities/${cityId}/barrios`, { nombre: newBarrioName.trim() });
      setNewBarrioFor(null);
      setNewBarrioName("");
      await load();
    } catch (e: any) {
      setError(e.message || "Error al crear barrio");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateBarrio = async (barrioId: string) => {
    if (!editValue.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const cityId = cities.find((c) => c.barrios?.some((b) => b.id === barrioId))?.id;
      if (cityId) {
        await api.put(`/api/lookup/cities/${cityId}/barrios/${barrioId}`, { nombre: editValue.trim() });
      }
      setEditingBarrio(null);
      setEditValue("");
      await load();
    } catch (e: any) {
      setError(e.message || "Error al actualizar barrio");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteBarrio = async (barrioId: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar el barrio "${nombre}"?`)) return;
    setBusy(true);
    setError(null);
    try {
      const cityId = cities.find((c) => c.barrios?.some((b) => b.id === barrioId))?.id;
      if (cityId) {
        await api.delete(`/api/lookup/cities/${cityId}/barrios/${barrioId}`);
      }
      await load();
    } catch (e: any) {
      setError(e.message || "Error al eliminar barrio");
    } finally {
      setBusy(false);
    }
  };

  const startEditCity = (city: City) => {
    setEditingCity(city.id);
    setEditValue(city.nombre);
  };

  const startEditBarrio = (barrio: Barrio) => {
    setEditingBarrio(barrio.id);
    setEditValue(barrio.nombre);
  };

  const cancelEdit = () => {
    setEditingCity(null);
    setEditingBarrio(null);
    setEditValue("");
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-display text-2xl font-bold tracking-tight lg:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Ubicaciones
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Gestioná ciudades y barrios
          </p>
        </div>
        <button
          onClick={() => setNewCityOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all"
          style={{ background: "var(--gold)" }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
        >
          <Plus className="h-4 w-4" />
          Nueva ciudad
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* New city form */}
      {newCityOpen && (
        <div
          className="mt-6 rounded-xl border p-5"
          style={{ borderColor: "var(--admin-border)", background: "var(--admin-surface)" }}
        >
          <div className="flex items-center gap-3">
            <input
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              placeholder="Nombre de la ciudad"
              className="flex-1 rounded-lg px-3 py-2 text-sm"
              style={{ background: "var(--admin-surface-hover)", border: "1px solid var(--admin-input-border)", color: "var(--admin-text)" }}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateCity(); }}
              autoFocus
            />
            <button
              onClick={handleCreateCity}
              disabled={busy || !newCityName.trim()}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "var(--gold)" }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Guardar
            </button>
            <button
              onClick={() => { setNewCityOpen(false); setNewCityName(""); }}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--admin-text-muted)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--admin-surface-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cities list */}
      {loading ? (
        <div className="mt-8 flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--gold)" }} />
        </div>
      ) : cities.length === 0 ? (
        <div className="mt-8 flex items-center justify-center py-20 text-sm" style={{ color: "var(--admin-text-dim)" }}>
          No hay ciudades cargadas
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {cities.map((city) => (
            <div
              key={city.id}
              className="rounded-xl border transition-all"
              style={{ borderColor: "var(--admin-border)", background: "var(--admin-surface)" }}
            >
              {/* City header */}
              <div
                className="flex cursor-pointer items-center gap-3 px-5 py-4"
                onClick={() => toggleExpand(city.id)}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: "var(--admin-surface-hover)" }}
                >
                  <MapPin className="h-4 w-4" style={{ color: "var(--gold)" }} />
                </div>

                {editingCity === city.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 rounded-lg px-3 py-1.5 text-sm font-medium"
                      style={{ background: "var(--admin-surface-hover)", border: "1px solid var(--admin-input-border)", color: "var(--admin-text)" }}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => { if (e.key === "Enter") handleUpdateCity(city.id); if (e.key === "Escape") cancelEdit(); }}
                      autoFocus
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpdateCity(city.id); }}
                      disabled={busy}
                      className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                      style={{ color: "oklch(0.55 0.15 150)" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--admin-surface-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                      style={{ color: "var(--admin-text-muted)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--admin-surface-hover)"; e.currentTarget.style.color = "var(--admin-destructive)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--admin-text-muted)"; }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{city.nombre}</div>
                      <div className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                        {city.barrios?.length || 0} barrio{(city.barrios?.length || 0) !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => startEditCity(city)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                        style={{ color: "var(--admin-text-muted)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--admin-surface-hover)"; e.currentTarget.style.color = "var(--gold)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--admin-text-muted)"; }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCity(city.id, city.nombre)}
                        disabled={busy}
                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                        style={{ color: "var(--admin-text-muted)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--admin-surface-hover)"; e.currentTarget.style.color = "var(--admin-destructive)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--admin-text-muted)"; }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}

                <div
                  className="flex h-6 w-6 items-center justify-center rounded transition-colors"
                  style={{ color: "var(--admin-text-muted)" }}
                >
                  {expanded[city.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </div>

              {/* Barrios */}
              {expanded[city.id] && (
                <div className="border-t px-5 py-3 space-y-2" style={{ borderColor: "var(--admin-border)" }}>
                  {city.barrios?.map((barrio) => (
                    <div
                      key={barrio.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2"
                      style={{ background: "var(--admin-bg)" }}
                    >
                      {editingBarrio === barrio.id ? (
                        <div className="flex flex-1 items-center gap-2">
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 rounded-lg px-3 py-1.5 text-sm"
                            style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-input-border)", color: "var(--admin-text)" }}
                            onKeyDown={(e) => { if (e.key === "Enter") handleUpdateBarrio(barrio.id); if (e.key === "Escape") cancelEdit(); }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateBarrio(barrio.id)}
                            disabled={busy}
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                            style={{ color: "oklch(0.55 0.15 150)" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--admin-surface-hover)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                            style={{ color: "var(--admin-text-muted)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--admin-surface-hover)"; e.currentTarget.style.color = "var(--admin-destructive)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--admin-text-muted)"; }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 text-sm">{barrio.nombre}</div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditBarrio(barrio)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                              style={{ color: "var(--admin-text-muted)" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--admin-surface-hover)"; e.currentTarget.style.color = "var(--gold)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--admin-text-muted)"; }}
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteBarrio(barrio.id, barrio.nombre)}
                              disabled={busy}
                              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                              style={{ color: "var(--admin-text-muted)" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--admin-surface-hover)"; e.currentTarget.style.color = "var(--admin-destructive)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--admin-text-muted)"; }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {/* New barrio form */}
                  {newBarrioFor === city.id ? (
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--admin-bg)" }}>
                      <input
                        value={newBarrioName}
                        onChange={(e) => setNewBarrioName(e.target.value)}
                        placeholder="Nombre del barrio"
                        className="flex-1 rounded-lg px-3 py-1.5 text-sm"
                        style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-input-border)", color: "var(--admin-text)" }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleCreateBarrio(city.id); if (e.key === "Escape") { setNewBarrioFor(null); setNewBarrioName(""); } }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleCreateBarrio(city.id)}
                        disabled={busy || !newBarrioName.trim()}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-50"
                        style={{ background: "var(--gold)" }}
                      >
                        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        Agregar
                      </button>
                      <button
                        onClick={() => { setNewBarrioFor(null); setNewBarrioName(""); }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                        style={{ color: "var(--admin-text-muted)" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--admin-surface-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setNewBarrioFor(city.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                      style={{ color: "var(--admin-text-muted)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--admin-surface-hover)"; e.currentTarget.style.color = "var(--gold)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--admin-text-muted)"; }}
                    >
                      <Plus className="h-3 w-3" />
                      Agregar barrio
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
