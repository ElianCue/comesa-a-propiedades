"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { MessageSquare, Mail, Phone, Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface InquiryData {
  id: string;
  property_id: string;
  nombre: string;
  email: string;
  telefono?: string;
  mensaje?: string;
  leido: boolean;
  created_at: string;
  property: {
    direccion: string;
    city: { nombre: string };
    barrio: { nombre: string };
  };
}

export default function AdminConsultas() {
  const [inquiries, setInquiries] = useState<InquiryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<InquiryData[]>("/api/inquiries");
      setInquiries(data);
    } catch {
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleRead = async (id: string) => {
    try {
      await api.put(`/api/inquiries/${id}/read`);
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/inquiries/${deleteId}`);
      load();
      setDeleteConfirmOpen(false);
      setDeleteId(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--gold)" }} />
      </div>
    );
  }

  const noLeidas = inquiries.filter((i) => !i.leido).length;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-display text-2xl font-bold tracking-tight lg:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Consultas
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--admin-text-muted)" }}>
            {inquiries.length} consultas
            {noLeidas > 0 && (
              <span className="ml-2 font-semibold" style={{ color: "var(--gold)" }}>
                · {noLeidas} sin leer
              </span>
            )}
          </p>
        </div>
      </div>

      {!inquiries.length ? (
        <div
          className="mt-8 flex flex-col items-center justify-center rounded-xl border py-20 text-sm"
          style={{
            borderColor: "var(--admin-border)",
            color: "var(--admin-text-dim)",
          }}
        >
          <MessageSquare className="mb-3 h-8 w-8" />
          Bandeja vacía
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {inquiries.map((inq, i) => (
            <div
              key={inq.id}
              className="animate-slide-up rounded-xl border transition-all"
              style={{
                animationDelay: `${i * 0.04}s`,
                background: "var(--admin-surface-active)",
                borderColor: inq.leido
                  ? "var(--admin-border)"
                  : "var(--gold)",
                borderLeftWidth: inq.leido ? "1px" : "3px",
                paddingLeft: inq.leido ? "23px" : "21px",
              }}
            >
              <div className="flex items-start gap-4 p-5">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    background: inq.leido ? "var(--admin-border)" : "var(--gold-dim)",
                    color: inq.leido ? "var(--admin-text-muted)" : "var(--gold)",
                  }}
                >
                  {inq.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{inq.nombre}</span>
                    {!inq.leido && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{ background: "var(--gold)", color: "oklch(0.08 0.005 285)" }}
                      >
                        Nuevo
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--admin-text-muted)" }}>
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {inq.email}
                    </span>
                    {inq.telefono && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {inq.telefono}
                      </span>
                    )}
                  </div>
                  {inq.mensaje && (
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--admin-text-muted)" }}>
                      {inq.mensaje}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--admin-text-dim)" }}>
                    <span>Ref: {inq.property.direccion}, {inq.property.barrio.nombre}, {inq.property.city.nombre}</span>
                    <span>·</span>
                    <span>
                      {new Date(inq.created_at).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => toggleRead(inq.id)}
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
                    title={inq.leido ? "Marcar como no leído" : "Marcar como leído"}
                  >
                    {inq.leido ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => { setDeleteId(inq.id); setDeleteConfirmOpen(true); }}
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
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onOpenChange={(open) => { setDeleteConfirmOpen(open); if (!open) setDeleteId(null); }}
        title="¿Eliminar consulta?"
        description="Esta acción no se puede deshacer. ¿Está seguro de que desea eliminar esta consulta?"
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        successMessage="Consulta eliminada correctamente"
      />
    </>
  );
}
