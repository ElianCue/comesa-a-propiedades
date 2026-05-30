"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { useProperties } from "@/hooks/useProperties";
import { CIUDADES, getBarrios, type Ciudad } from "@/lib/properties";
import { Search, Compass, MessageCircle, Building2, Shield, Star, MapPin, ArrowRight, ChevronRight, Quote } from "lucide-react";
import laPlata from "@/assets/images/la-plata.jpg";
import loboMarino from "@/assets/images/lobo-marino.jpg";
import logo from "@/assets/images/Logo2.png";

// Toggle this for logo style: 'sharp' for crisp logo, 'blur' for diffused overlay
const HERO_LOGO_STYLE = "sharp" as 'sharp' | 'blur';

type Tab = "Todos" | "Venta" | "Alquiler" | "Casa" | "Depto" | "PH";

export default function HomePage() {
  const router = useRouter();
  const [all, , loaded] = useProperties();
  const [tab, setTab] = useState<Tab>("Todos");
  const [ciudad, setCiudad] = useState<"" | Ciudad>("");
  const [op, setOp] = useState<"" | "Venta" | "Alquiler">("");
  const [tipo, setTipo] = useState("");
  const [zona, setZona] = useState("");
  const [maxPrice, setMaxPrice] = useState(300000);

  const barriosDisponibles = useMemo(() => getBarrios(ciudad), [ciudad]);

  const filtered = useMemo(() => {
    return all.filter((p) => {
      if (!p.activo) return false;
      if (tab === "Venta" || tab === "Alquiler") {
        if (p.operacion !== tab) return false;
      }
      if (tab === "Casa" || tab === "Depto" || tab === "PH") {
        if (p.tipo !== tab) return false;
      }
      if (ciudad && (p.ciudad ?? "La Plata") !== ciudad) return false;
      if (op && p.operacion !== op) return false;
      if (tipo && p.tipo !== tipo) return false;
      if (zona && p.barrio !== zona) return false;
      if (p.moneda === "USD" && p.precio > maxPrice) return false;
      return true;
    });
  }, [all, tab, ciudad, op, tipo, zona, maxPrice]);

  const tabs: Tab[] = ["Todos", "Venta", "Alquiler", "Casa", "Depto", "PH"];

  const filterByBarrio = (b: string, c: Ciudad) => {
    router.push(`/busqueda?ciudad=${encodeURIComponent(c)}&barrio=${encodeURIComponent(b)}`);
  };

  const [barrioTab, setBarrioTab] = useState<Ciudad>("La Plata");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden bg-[oklch(0.13_0.005_285)] text-white">
        <div className="absolute inset-0">
          {/* Layered Hero Collage */}
          <div className="absolute inset-0">
            {/* Catedral background left */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: "polygon(0 0, 42% 0, 18% 100%, 0 100%)",
                zIndex: 1,
              }}
            >
              <Image
                src={laPlata}
                alt="Catedral de La Plata"
                fill
                className="object-cover object-center"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/40 to-transparent" />
            </div>
            {/* Lobo marino background right */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: "polygon(42% 0, 100% 0, 100% 100%, 18% 100%)",
                zIndex: 1,
              }}
            >
<Image
                 src={loboMarino}
                 alt="Lobo Marino, Mar del Plata"
                 fill
                 className="object-cover object-left"
                 priority
              />
              <div className="absolute inset-0 bg-gradient-to-tl from-black/80 via-black/30 to-transparent" />
            </div>

            {/* Logo integration (sharp vs blur) */}
            {HERO_LOGO_STYLE === "sharp" ? (
              <div className="absolute left-1/2 top-1/2 z-10 w-[130px] md:w-[170px] -translate-x-1/2 -translate-y-1/2 drop-shadow-xl">
                <Image
                  src={logo}
                  alt="Comensaña Propiedades logo"
                  width={340}
                  height={340}
                  className="w-full h-auto"
                  priority
                />
              </div>
            ) : (
              <div className="absolute left-1/2 top-1/2 z-10 w-[220px] md:w-[300px] -translate-x-1/2 -translate-y-1/2 blur-[2px] opacity-60">
                <Image
                  src={logo}
                  alt="Comensaña Propiedades logo difuminado"
                  width={340}
                  height={340}
                  className="w-full h-auto"
                  priority
                />
              </div>
            )}
            {/* Soft light overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/80 z-20 pointer-events-none" />
            {/* Texture/noise for editorial feel */}
            <div className="absolute inset-0 noise-overlay opacity-[0.08] z-30 pointer-events-none" />
          </div>
        </div>

          <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32 z-40">
          <div className="max-w-3xl">
            <div className="animate-slide-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-[oklch(0.85_0_0)]">
              Inmobiliaria · La Plata & Mar del Plata
            </div>
            <h1 className="animate-slide-up delay-1 mt-4 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Tu hogar,
              <br />
              <span className="italic text-[oklch(0.78_0.13_80)]">
                nuestra misión.
              </span>
            </h1>
            <p className="animate-slide-up delay-2 mt-6 max-w-xl text-lg text-[oklch(0.8_0_0)]">
              Propiedades en La Plata y Mar del Plata. Encontrá la tuya con asesoramiento profesional.
            </p>
          </div>

          <div className="animate-slide-up delay-3 mt-10 grid gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-xl md:grid-cols-6">
            <select
              value={ciudad}
              onChange={(e) => {
                setCiudad(e.target.value as "" | Ciudad);
                setZona("");
              }}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-3 text-sm text-white backdrop-blur-md"
            >
              <option value="" className="text-foreground">Ciudad</option>
              {CIUDADES.map((c) => (
                <option key={c} className="text-foreground">{c}</option>
              ))}
            </select>
            <select
              value={op}
              onChange={(e) =>
                setOp(e.target.value as "Venta" | "Alquiler" | "")
              }
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-3 text-sm text-white backdrop-blur-md"
            >
              <option value="" className="text-foreground">Operación</option>
              <option className="text-foreground">Venta</option>
              <option className="text-foreground">Alquiler</option>
            </select>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-3 text-sm text-white backdrop-blur-md"
            >
              <option value="" className="text-foreground">Tipo</option>
              <option className="text-foreground">Casa</option>
              <option className="text-foreground">Depto</option>
              <option className="text-foreground">PH</option>
              <option className="text-foreground">Local</option>
            </select>
            <select
              value={zona}
              onChange={(e) => setZona(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-3 text-sm text-white backdrop-blur-md"
            >
              <option value="" className="text-foreground">Zona</option>
              {barriosDisponibles.map((b) => (
                <option key={b} className="text-foreground">{b}</option>
              ))}
            </select>
            <div className="flex flex-col justify-center rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur-md">
              <label className="text-[10px] uppercase tracking-wider text-white/60">
                Precio máx · USD {maxPrice.toLocaleString()}
              </label>
              <input
                type="range"
                min={50000}
                max={400000}
                step={5000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(+e.target.value)}
                className="accent-[oklch(0.78_0.13_80)]"
              />
            </div>
            <Link
              href="/busqueda"
              className="flex items-center justify-center gap-2 rounded-lg bg-[oklch(0.78_0.13_80)] px-4 py-3 text-sm font-semibold text-[oklch(0.15_0_0)] transition hover:brightness-105"
            >
              <Search className="h-4 w-4" />
              Buscar
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Quick skeleton while loading to avoid empty hero-only view */}
        {!loaded ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-card p-4">
                <div className="h-44 w-full rounded-md bg-muted" />
                <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
                <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {all.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
