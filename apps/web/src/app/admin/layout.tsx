"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import Image from "next/image";
import {
  Building2,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Loader2,
  Moon,
  Sun,
} from "lucide-react";
import logo from "@/assets/images/Logo2.png";

interface AdminUser {
  id: string;
  email: string;
  nombre: string;
}

function useTheme() {
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

  return { theme, toggle, mounted };
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle, mounted } = useTheme();

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
      <div className="admin-theme dark flex min-h-screen items-center justify-center" style={{ background: "var(--admin-bg)" }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--gold)" }} />
      </div>
    );
  }

  if (!admin) return null;

  const navItems = [
    { href: "/admin", label: "Propiedades", icon: Building2 },
  ];

  return (
    <div className={`admin-theme ${mounted ? theme : "dark"}`} style={{ background: "var(--admin-bg)", minHeight: "100vh", color: "var(--admin-text)", fontFamily: "var(--font-sans)" }}>
      <style>{`
        .admin-theme input, .admin-theme select, .admin-theme textarea {
          background: var(--admin-input-bg);
          border-color: var(--admin-input-border);
          color: var(--admin-text);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 14px;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }
        .admin-theme input:focus, .admin-theme select:focus, .admin-theme textarea:focus {
          border-color: var(--admin-input-focus);
        }
        .admin-theme input::placeholder, .admin-theme textarea::placeholder {
          color: var(--admin-text-muted);
        }
        .admin-scrollbar::-webkit-scrollbar { width: 4px; }
        .admin-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .admin-scrollbar::-webkit-scrollbar-thumb { background: var(--admin-surface-active); border-radius: 2px; }
        .admin-theme select option {
          background: var(--admin-surface);
          color: var(--admin-text);
        }
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
          background: "var(--admin-surface)",
          borderColor: "var(--admin-border)",
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div className="flex h-16 items-center gap-3 border-b px-5" style={{ borderColor: "var(--admin-border)" }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden" style={{ background: "var(--gold)" }}>
            <Image src={logo} alt="" className="h-6 w-6 object-contain" />
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
                  color: active ? "var(--gold)" : "var(--admin-text-muted)",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--admin-surface-hover)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t px-3 py-4" style={{ borderColor: "var(--admin-border)" }}>
          <div className="mb-2 px-3 text-xs" style={{ color: "var(--admin-text-muted)" }}>
            {admin.email}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
            style={{ color: "var(--admin-text-muted)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--admin-surface-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Modo claro" : "Modo oscuro"}
          </button>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
            style={{ color: "var(--admin-text-muted)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--admin-surface-hover)"}
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
          style={{ borderColor: "var(--admin-border)" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center"
          >
            <Menu className="h-5 w-5" style={{ color: "var(--admin-text-muted)" }} />
          </button>
          <div className="flex h-7 w-7 items-center justify-center rounded overflow-hidden" style={{ background: "var(--gold)" }}>
            <Image src={logo} alt="" className="h-5 w-5 object-contain" />
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
