"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
  successMessage?: string;
}

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading = false,
  successMessage
}: Props) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
      setSuccess(true);
      if (successMessage) {
        // Auto-close after success message
        setTimeout(() => {
          onOpenChange(false);
          setSuccess(false);
        }, 1500);
      } else {
        onOpenChange(false);
      }
    } catch (err: any) {
      setError(err.message || "Error al realizar la acción");
    }
  };

  if (!isOpen && !success) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 z-0 bg-black/60" onClick={() => { onOpenChange(false); setSuccess(false); setError(null); }} />
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="rounded-xl border p-6 shadow-2xl" style={{ background: "var(--admin-surface)", borderColor: "var(--admin-border)" }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold tracking-tight" style={{ color: "var(--admin-text)" }}>
              {title}
            </h2>
            <button
              onClick={() => { onOpenChange(false); setSuccess(false); setError(null); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--admin-text-muted)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--admin-surface-active)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Success State */}
          {success && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto" style={{ color: "var(--admin-active-text)" }} />
              <h3 className="font-display text-xl font-semibold tracking-tight" style={{ color: "var(--gold)" }}>
                Éxito
              </h3>
              {successMessage && (
                <p className="mt-2 text-sm" style={{ color: "var(--admin-text-muted)" }}>
                  {successMessage}
                </p>
              )}
            </div>
          )}

          {/* Form State */}
          {!success && (
            <>
              {description && (
                <p className="mb-4 text-sm" style={{ color: "var(--admin-text-muted)" }}>
                  {description}
                </p>
              )}

              {error && (
                <div className="mb-4 rounded-lg p-3 text-sm" style={{ background: "var(--admin-destructive)", color: "#fff" }}>
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { onOpenChange(false); setSuccess(false); setError(null); }}
                  className="rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
                  style={{ background: "var(--admin-surface-hover)", color: "var(--admin-text-muted)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--admin-border)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "var(--admin-surface-hover)"}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: "var(--gold)", color: "oklch(0.08 0.005 285)" }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.filter = "brightness(1.1)"; }}
                  onMouseLeave={(e) => { if (!loading) e.currentTarget.style.filter = "none"; }}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}