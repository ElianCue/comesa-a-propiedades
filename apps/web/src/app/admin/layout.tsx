"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import {
  Building2,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Loader2,
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  nombre: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }
    api.get<AdminUser | null>("/api/auth/me")
      .then((a) => {
        if (!a) router.push("/admin/login");
        else setAdmin(a);
      })
      .catch(() => router.push("/admin/login"))
      .finally(() => setLoading(false));
  }, [isLoginPage]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await api.post("/api/auth/logout");
    router.push("/");
  };

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="admin-theme flex min-h-screen items-center justify-center" style={{ background: "oklch(0.08 0.005 285)" }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "oklch(0.78 0.13 80)" }} />
      </div>
    );
  }

  if (!admin) return null;

  const navItems = [
    { href: "/admin", label: "Propiedades", icon: Building2 },
  ];

  return (
    <div className="admin-theme" style={{ background: "oklch(0.08 0.005 285)", minHeight: "100vh", color: "oklch(0.98 0 0)", fontFamily: "var(--font-sans)" }}>
      <style>{`
        .admin-theme {
          --gold: oklch(0.78 0.13 80);
          --gold-dim: oklch(0.78 0.13 80 / 0.15);
        }
        .admin-theme input, .admin-theme select, .admin-theme textarea {
          background: oklch(0.14 0.005 285);
          border-color: oklch(0.22 0.005 285);
          color: oklch(0.98 0 0);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 14px;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }
        .admin-theme input:focus, .admin-theme select:focus, .admin-theme textarea:focus {
          border-color: var(--gold);
        }
        .admin-theme input::placeholder, .admin-theme textarea::placeholder {
          color: oklch(0.4 0.01 285);
        }
        .admin-scrollbar::-webkit-scrollbar { width: 4px; }
        .admin-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .admin-scrollbar::-webkit-scrollbar-thumb { background: oklch(0.25 0.01 285); border-radius: 2px; }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r transition-transform duration-300"
        style={{
          background: "oklch(0.1 0.005 285)",
          borderColor: "oklch(0.18 0.005 285)",
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div className="flex h-16 items-center gap-3 border-b px-5" style={{ borderColor: "oklch(0.18 0.005 285)" }}>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
            style={{ background: "var(--gold)", color: "oklch(0.08 0.005 285)" }}
          >
            CP
          </div>
          <span className="font-display text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Admin
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
                style={{
                  background: active ? "var(--gold-dim)" : "transparent",
                  color: active ? "var(--gold)" : "oklch(0.6 0.01 285)",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "oklch(0.18 0.005 285)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t px-3 py-4" style={{ borderColor: "oklch(0.18 0.005 285)" }}>
          <div className="mb-3 px-3 text-xs" style={{ color: "oklch(0.45 0.01 285)" }}>
            {admin.email}
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
            style={{ color: "oklch(0.5 0.01 285)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "oklch(0.18 0.005 285)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div>
        {/* Top bar */}
        <div
          className="flex h-16 items-center gap-3 border-b px-5"
          style={{ borderColor: "oklch(0.18 0.005 285)" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center"
          >
            <Menu className="h-5 w-5" style={{ color: "oklch(0.6 0.01 285)" }} />
          </button>
          <div
            className="flex h-7 w-7 items-center justify-center rounded text-xs font-bold"
            style={{ background: "var(--gold)", color: "oklch(0.08 0.005 285)" }}
          >
            CP
          </div>
          <span className="font-display text-base font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Admin
          </span>
        </div>

        <main className="p-6 lg:p-8 admin-scrollbar" style={{ maxHeight: "100vh", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
