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
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      <div className="relative z-10 w-full max-w-md">
        {/* Backdrop */}
        <div className="fixed inset-0 z-0 bg-black/50"></div>
        
        {/* Dialog */}
        <div className="relative bg-[oklch(0.1_0.005_285)] rounded-xl border border-[oklch(0.18_0.005_285)] p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}>
              {title}
            </h2>
            <button
              onClick={() => {
                onOpenChange(false);
                setSuccess(false);
                setError(null);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ color: "oklch(0.5 0.01 285)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "oklch(0.18 0.005 285)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Success State */}
          {success && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto text-[oklch(0.55_0.15_150)]" />
              <h3 className="font-display text-xl font-semibold tracking-tight"
                  style={{ fontFamily: "var(--font-display)", color: "var(--gold)" }}>
                Éxito
              </h3>
              {successMessage && (
                <p className="mt-2 text-sm text-[oklch(0.5 0.01 285)]">
                  {successMessage}
                </p>
              )}
            </div>
          )}

          {/* Form State */}
          {!success && (
            <>
              {/* Description */}
              {description && (
                <p className="mb-4 text-[oklch(0.5 0.01 285)]">
                  {description}
                </p>
              )}

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 rounded-lg text-sm text-red-400 bg-red-950/30">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    onOpenChange(false);
                    setSuccess(false);
                    setError(null);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                  style={{ color: "oklch(0.5 0.01 285)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "oklch(0.18 0.005 285)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="inline-flex h-9 w-9 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
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