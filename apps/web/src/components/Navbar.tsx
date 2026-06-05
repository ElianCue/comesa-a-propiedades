"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Map, Search, Menu, X, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { WHATSAPP } from "@/lib/properties";
import logo from "@/assets/images/Logo2.png";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/mapa", label: "Mapa", icon: Map },
    { href: "/busqueda", label: "Buscar", icon: Search },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[color:var(--background)_/0.95] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="group flex items-center gap-3">
            <Image
              src={logo}
              alt="Comesaña Propiedades"
              className="h-8 w-auto transition duration-200 group-hover:scale-105"
              priority
            />
          </Link>

          <div className="hidden items-center gap-0.5 md:flex">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <span className="absolute inset-0 rounded-lg bg-muted" />
                  )}
                  <span className="relative flex items-center gap-2">
                    <l.icon className="h-4 w-4" />
                    {l.label}
                  </span>
                </Link>
              );
            })}
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              className="ml-3 inline-flex items-center gap-2 rounded-lg bg-[oklch(0.55_0.15_150)] px-3.5 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 hover:shadow-lg"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden lg:inline">Consultar</span>
            </a>
          </div>

          <button
            className="md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menú"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      />

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-background shadow-2xl transition-transform duration-300 ease-out md:hidden",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col gap-2 px-6 pt-28">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3.5 text-lg font-medium transition",
                  active
                    ? "bg-muted text-foreground"
                    : "text-foreground/70 hover:text-foreground"
                )}
              >
                <l.icon className="h-5 w-5" />
                {l.label}
              </Link>
            );
          })}
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center gap-3 rounded-xl bg-[oklch(0.55_0.15_150)] px-4 py-3.5 text-lg font-semibold text-white"
          >
            <MessageCircle className="h-5 w-5" />
            Consultar por WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}
