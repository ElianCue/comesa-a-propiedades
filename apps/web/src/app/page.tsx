"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { useProperties } from "@/hooks/useProperties";
import { api } from "@/lib/api-client";
import { CIUDADES, getBarrios, WHATSAPP, WHATSAPP_VISITA, type Ciudad } from "@/lib/properties";
import { Search, Compass, MessageCircle, Shield, MapPin, ChevronRight, BarChart3, BadgeCheck, Target, Navigation } from "lucide-react";
import hero from "@/assets/images/Hero.png";
import logo from "@/assets/images/Logo2.png";

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
  const [rawBarrios, setRawBarrios] = useState<Array<{ id: string; nombre: string; city_id: string }>>([]);
  const [cityMap, setCityMap] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      api.get<any[]>("/api/lookup/cities").catch(() => []),
      api.get<any[]>("/api/lookup/barrios").catch(() => []),
    ]).then(([cities, barrios]) => {
      const cArr = Array.isArray(cities) ? cities : [];
      const bArr = Array.isArray(barrios) ? barrios : [];
      const map: Record<string, string> = {};
      for (const c of cArr) map[c.nombre] = c.id;
      setCityMap(map);
      setRawBarrios(bArr);
    });
  }, []);

  const barriosDisponibles = useMemo(() => {
    if (rawBarrios.length === 0 || Object.keys(cityMap).length === 0) return getBarrios(ciudad);
    const cityId = cityMap[ciudad];
    if (!cityId) return [];
    return rawBarrios.filter((b) => b.city_id === cityId).map((b) => b.nombre);
  }, [ciudad, rawBarrios, cityMap]);

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

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[oklch(0.13_0.005_285)] text-white">
        <div className="absolute inset-0">
          <Image
            src={hero}
            alt="La Plata y Mar del Plata"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/80 z-20 pointer-events-none" />
          <div className="absolute inset-0 noise-overlay opacity-[0.08] z-30 pointer-events-none" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 z-40">
          {/* Mobile: logo + WhatsApp */}
          <div className="flex flex-col items-center justify-center py-16 md:hidden">
            <Image
              src={logo}
              alt="Comesaña Propiedades"
              className="h-12 w-auto"
              priority
            />
            <span className="mt-1 text-xs font-medium tracking-wide text-white/60">Paola Comesaña · Col. 7470</span>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.55_0.15_150)] px-3 py-1.5 text-[11px] font-medium text-white transition hover:brightness-110"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                +54 9 2215 05-8811
              </a>
              <a
                href={`https://wa.me/${WHATSAPP_VISITA}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                <Navigation className="h-3.5 w-3.5" />
                +54 9 2215 43-7743
              </a>
            </div>
          </div>

          {/* Desktop: text content */}
          <div className="hidden py-24 md:block md:py-32">
            <div className="max-w-3xl">
              <p className="animate-slide-up text-lg text-[oklch(0.8_0_0)] md:text-xl">
                Propiedades en La Plata y Mar del Plata. Encontrá la tuya con asesoramiento profesional.
              </p>
              <div className="animate-slide-up delay-1 mt-6 flex flex-wrap gap-3">
                <a
                  href={`https://wa.me/${WHATSAPP}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.55_0.15_150)] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                >
                  <MessageCircle className="h-4 w-4" />
                  +54 9 2215 05-8811
                </a>
                <a
                  href={`https://wa.me/${WHATSAPP_VISITA}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/10"
                >
                  <Navigation className="h-4 w-4" />
                  +54 9 2215 43-7743
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTERS BAR (below hero on mobile, inside hero on desktop) ── */}
      <div className="relative z-50 mx-auto max-w-7xl px-6 -mt-6 md:-mt-10">
        <div className="animate-slide-up grid gap-3 rounded-2xl border p-4 md:grid-cols-6 max-md:border-border max-md:bg-card md:border-white/15 md:bg-white/5 md:backdrop-blur-xl">
          <select
            value={ciudad}
            onChange={(e) => {
              setCiudad(e.target.value as "" | Ciudad);
              setZona("");
            }}
            className="rounded-lg border px-3 py-3 text-sm backdrop-blur-md max-md:bg-background max-md:text-foreground max-md:border-border md:border-white/20 md:bg-white/10 md:text-white"
          >
            <option value="">Ciudad</option>
            {CIUDADES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={op}
            onChange={(e) =>
              setOp(e.target.value as "Venta" | "Alquiler" | "")
            }
            className="rounded-lg border px-3 py-3 text-sm backdrop-blur-md max-md:bg-background max-md:text-foreground max-md:border-border md:border-white/20 md:bg-white/10 md:text-white"
          >
            <option value="">Operación</option>
            <option>Venta</option>
            <option>Alquiler</option>
          </select>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="rounded-lg border px-3 py-3 text-sm backdrop-blur-md max-md:bg-background max-md:text-foreground max-md:border-border md:border-white/20 md:bg-white/10 md:text-white"
          >
            <option value="">Tipo</option>
            <option>Casa</option>
            <option>Depto</option>
            <option>PH</option>
            <option>Local</option>
          </select>
          <select
            value={zona}
            onChange={(e) => setZona(e.target.value)}
            className="rounded-lg border px-3 py-3 text-sm backdrop-blur-md max-md:bg-background max-md:text-foreground max-md:border-border md:border-white/20 md:bg-white/10 md:text-white"
          >
            <option value="">Zona</option>
            {barriosDisponibles.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          <div className="flex flex-col justify-center rounded-lg border px-3 py-2 text-sm backdrop-blur-md max-md:bg-background max-md:text-foreground max-md:border-border md:border-white/20 md:bg-white/10 md:text-white">
            <label className="text-[10px] uppercase tracking-wider max-md:text-muted-foreground md:text-white/60">
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

      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Destacados section */}
        <section>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.78_0.13_80/0.3)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[oklch(0.78_0.13_80)]">
                Propiedades destacadas
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                Encontrá tu próximo hogar
              </h2>
            </div>
            <Link
              href="/busqueda"
              className="hidden items-center gap-1 text-sm font-medium text-[oklch(0.78_0.13_80)] transition hover:brightness-110 md:flex"
            >
              Ver todas <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

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
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {all.slice(0, 6).map((p) => (
                  <PropertyCard key={p.id} p={p} />
                ))}
              </div>
              <div className="mt-8 text-center md:hidden">
                <Link
                  href="/busqueda"
                  className="inline-flex items-center gap-1 rounded-xl border border-border px-6 py-3 text-sm font-medium transition hover:bg-muted"
                >
                  Ver todas las propiedades <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          )}
        </section>

        {/* Por qué elegirnos */}
        <section className="mt-24">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.78_0.13_80/0.3)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[oklch(0.78_0.13_80)]">
              Por qué elegirnos
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Asesoramiento profesional <br className="hidden md:block" />
              en cada paso
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: BarChart3,
                title: "Servicios integrales",
                desc: "Ofrecemos servicios de tasaciones, compraventa y alquileres.",
              },
              {
                icon: BadgeCheck,
                title: "Asesoramiento matriculado",
                desc: "Asesoramiento adecuado con intervención del martillero y corredor matriculado.",
              },
              {
                icon: Shield,
                title: "Seguridad jurídica",
                desc: "Seguridad y control de legalidad del desarrollo y de los involucrados en la transacción.",
              },
              {
                icon: Target,
                title: "Criterios objetivos",
                desc: "Concreción de operaciones a partir de criterios objetivos.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[oklch(0.78_0.13_80/0.1)] text-[oklch(0.78_0.13_80)] transition group-hover:bg-[oklch(0.78_0.13_80)] group-hover:text-white">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Zonas */}
        <section className="mt-24">
          <div className="mb-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.78_0.13_80/0.3)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[oklch(0.78_0.13_80)]">
              Zonas
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Propiedades en La Plata y Mar del Plata
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                ciudad: "La Plata",
                barrios: ["Centro", "Tolosa", "Gonnet", "City Bell", "Villa Elisa", "Los Hornos", "San Carlos"],
                href: "/busqueda?ciudad=La%20Plata",
              },
              {
                ciudad: "Mar del Plata",
                barrios: ["Centro", "La Perla", "Playa Grande"],
                href: "/busqueda?ciudad=Mar%20del%20Plata",
              },
            ].map((zona) => (
              <Link
                key={zona.ciudad}
                href={zona.href}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative z-10">
                  <h3 className="font-display text-2xl font-bold">{zona.ciudad}</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {zona.barrios.map((b) => (
                      <span
                        key={b}
                        className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition group-hover:border-[oklch(0.78_0.13_80/0.3)] group-hover:text-[oklch(0.78_0.13_80)]"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 z-0 flex h-32 w-32 items-center justify-center rounded-full border border-border/50 text-4xl text-muted-foreground/20 transition group-hover:scale-110 group-hover:border-[oklch(0.78_0.13_80/0.2)] group-hover:text-[oklch(0.78_0.13_80/0.2)]">
                  <Compass className="h-16 w-16" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-24">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[oklch(0.13_0.005_285)] to-[oklch(0.08_0.005_285)] px-8 py-14 text-center md:px-16">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[oklch(0.78_0.13_80/0.08)] blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[oklch(0.32_0.08_255/0.08)] blur-3xl" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
                ¿Buscás una propiedad?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[oklch(0.7_0_0)]">
                Contactanos hoy y empezá el camino hacia tu nuevo hogar. Te ayudamos a encontrar la propiedad que se adapta a vos.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href={`https://wa.me/${WHATSAPP}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[oklch(0.55_0.15_150)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  <MessageCircle className="h-4 w-4" />
                  Consultar por WhatsApp
                </a>
                <Link
                  href="/busqueda"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <Search className="h-4 w-4" />
                  Explorar propiedades
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
