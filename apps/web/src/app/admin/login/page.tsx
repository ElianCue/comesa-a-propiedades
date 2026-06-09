"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Moon, Sun, Loader2 } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  nombre: string;
}

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("comesana.admin.theme") as "light" | "dark" | null;
    if (stored) setTheme(stored);
    else setTheme("light");
    setMounted(true);
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("comesana.admin.theme", next);
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const admin = await api.post<AdminUser>("/api/auth/login", { email, password });
      if (admin) router.push("/admin");
    } catch {
      setErr("Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`admin-theme ${mounted ? theme : "dark"} flex min-h-screen items-center justify-center`}
      style={{ background: "var(--admin-bg)" }}
    >
      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="fixed right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg transition-all"
        style={{ color: "var(--admin-text-muted)" }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--admin-surface-hover)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Noise texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "300px 300px",
        }}
      />

      <div
        className="relative w-full max-w-sm rounded-2xl border p-8"
        style={{
          background: "var(--admin-surface)",
          borderColor: "var(--admin-border)",
          boxShadow: "0 0 60px oklch(0.78 0.13 80 / 0.06)",
        }}
      >
        <div className="text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold"
            style={{ background: "var(--gold)", color: "oklch(0.08 0.005 285)" }}
          >
            CP
          </div>
          <h1
            className="mt-4 font-display text-xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--admin-text)" }}
          >
            Panel de Administración
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Acceso restringido
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <div className="mb-1.5 text-[11px] font-medium" style={{ color: "var(--admin-text-muted)" }}>
              Email
            </div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@comesana.com"
              style={{
                width: "100%",
                background: "var(--admin-surface-hover)",
                border: "1px solid var(--admin-input-border)",
                color: "var(--admin-text)",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
              onBlur={(e) => e.target.style.borderColor = "var(--admin-input-border)"}
            />
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-medium" style={{ color: "var(--admin-text-muted)" }}>
              Contraseña
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                background: "var(--admin-surface-hover)",
                border: "1px solid var(--admin-input-border)",
                color: "var(--admin-text)",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
              onBlur={(e) => e.target.style.borderColor = "var(--admin-input-border)"}
            />
          </div>

          {err && (
            <div className="text-xs" style={{ color: "var(--admin-destructive)" }}>
              {err}
            </div>
          )}

          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: "var(--gold)", color: "oklch(0.08 0.005 285)" }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.filter = "brightness(1.1)"; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.filter = "none"; }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
