"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { api } from "@/lib/api-client";
import {
  formatPriceFromProperty,
  WHATSAPP,
  propertyTitle,
  propertyDescription,
  SITE_URL,
  type Property,
} from "@/lib/properties";
import {
  Bed,
  Bath,
  Maximize2,
  Car,
  Trees,
  Flame,
  Waves,
  Home,
  ArrowLeft,
  Share2,
  MessageCircle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  Ruler,
  Layers,
  ImageIcon,
  Building,
  Phone,
  Navigation,
} from "lucide-react";

declare global {
  interface Window {
    L: any;
  }
}

interface Props {
  params: { slug: string };
}

export default function PropertyPage({ params }: Props) {
  const { slug } = params;
  const [p, setP] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    const id = slug.split("-").pop();
    if (!id) {
      setLoading(false);
      return;
    }
    api
      .get<any>(`/api/properties/${id}`)
      .then((res) => setP(res ?? null))
      .catch(() => setP(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (p) {
      document.title = propertyTitle(p);
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", propertyDescription(p));
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", propertyTitle(p));
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", propertyDescription(p));
    }
  }, [p]);

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstance.current || !p) return;
    const L = window.L;
    if (!L) return;
    const lat = p.lat;
    const lng = p.lng;
    if (lat === 0 && lng === 0) return;
    mapInstance.current = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView([lat, lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(mapInstance.current);
    const icon = L.divIcon({
      className: "",
      html: `<div style="background:oklch(0.32 0.08 255);color:white;padding:8px 14px;border-radius:999px;font-size:13px;font-weight:700;font-family:DM Sans,sans-serif;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,0.4);border:2.5px solid white">${formatPriceFromProperty(p)}</div>`,
      iconSize: [150, 40],
      iconAnchor: [75, 40],
    });
    L.marker([lat, lng], { icon }).addTo(mapInstance.current);
    setTimeout(() => mapInstance.current?.invalidateSize(), 200);
    setMapReady(true);
  }, [p]);

  useEffect(() => {
    if (!p) return;
    if (p.lat === 0 && p.lng === 0) return;
    if (mapInstance.current) return;
    if (window.L) {
      initMap();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = initMap;
    document.head.appendChild(s);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [p, initMap]);

  useEffect(() => {
    if (!mapReady || !p) return;
    const handleResize = () => mapInstance.current?.invalidateSize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mapReady, p]);

  const photos = p?.fotos?.filter(Boolean) ?? [];
  const photoCount = photos.length;

  const lightboxNavigate = (delta: number) => {
    if (lightboxIdx === null) return;
    const next = lightboxIdx + delta;
    if (next >= 0 && next < photoCount) {
      setLightboxIdx(next);
    }
  };

  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowLeft") lightboxNavigate(-1);
      if (e.key === "ArrowRight") lightboxNavigate(1);
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [lightboxIdx]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-6 aspect-[21/9] animate-pulse rounded-2xl bg-muted" />
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <div className="h-6 w-48 animate-pulse rounded bg-muted" />
              <div className="h-12 w-72 animate-pulse rounded bg-muted" />
              <div className="h-4 w-56 animate-pulse rounded bg-muted" />
              <div className="mt-8 grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            </div>
            <div className="h-[500px] animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl px-6 py-12 text-center">
          <h1 className="mb-4 text-2xl font-bold">Propiedad no encontrada</h1>
          <p className="mb-6 text-muted-foreground">
            La propiedad que buscas no existe o fue eliminada.
          </p>
          <Link href="/" className="text-primary hover:underline">
            Volver al listado
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const waText = encodeURIComponent(
    `Hola! Me interesa la propiedad en ${p.direccion}, ${p.barrio} (${p.ciudad}) publicada en Comensaña Propiedades. Precio: ${formatPriceFromProperty(p)}`
  );

  const amenityIcons = [
    p.cochera && { icon: Car, label: "Cochera" },
    p.jardin && { icon: Trees, label: "Jardín" },
    p.parrilla && { icon: Flame, label: "Parrilla" },
    p.pileta && { icon: Waves, label: "Pileta" },
    p.balcon && { icon: Home, label: "Balcón" },
  ].filter(Boolean) as { icon: typeof Car; label: string }[];

  const extraAmenities: string[] = [];
  if (p.amenities) {
    const known = new Set(["Cochera", "Jardín", "Parrilla", "Pileta", "Balcón"]);
    for (const a of p.amenities) {
      if (!known.has(a)) extraAmenities.push(a);
    }
  }

  const hasMap = p.lat !== 0 && p.lng !== 0;

  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: propertyTitle(p),
    description: propertyDescription(p),
    url: `${SITE_URL}/propiedad/${p.id}`,
    image: p.fotos,
    offers: {
      "@type": "Offer",
      price: p.precio,
      priceCurrency: p.moneda,
      availability: "https://schema.org/InStock",
    },
  };

  const thumbRows = Math.min(photoCount, 4);
  const mainThumbs = photos.slice(1, thumbRows);
  const remaining = photoCount - thumbRows;

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al listado
        </Link>

        {/* ── HERO GALLERY ── */}
        {photoCount > 0 ? (
          <div className="grid animate-slide-up grid-cols-1 gap-2 md:grid-cols-4 md:grid-rows-2">
            <div
              className="relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl bg-muted md:col-span-2 md:row-span-2 md:aspect-auto"
              onClick={() => setLightboxIdx(0)}
            >
              <img
                src={photos[0]}
                alt={`${p.tipo} en ${p.barrio}, ${p.ciudad}`}
                className="h-full w-full object-cover transition duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
                <ImageIcon className="h-3.5 w-3.5" />
                {photoCount} fotos
              </div>
            </div>
            {mainThumbs.map((f, i) => (
              <div
                key={f}
                className="relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl bg-muted max-md:hidden"
                onClick={() => setLightboxIdx(i + 1)}
              >
                <img
                  src={f}
                  alt={`${p.tipo} en ${p.barrio} — foto ${i + 2}`}
                  className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  loading="eager"
                />
              </div>
            ))}
            {remaining > 0 && (
              <div
                className="relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl bg-muted max-md:hidden"
                onClick={() => setLightboxIdx(4)}
              >
                <img
                  src={photos[4]}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white backdrop-blur-sm">
                  +{remaining}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex aspect-[21/9] items-center justify-center rounded-2xl bg-muted">
            <div className="text-center">
              <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">Sin fotos</p>
            </div>
          </div>
        )}

        {/* ── LIGHTBOX ── */}
        {lightboxIdx !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg"
            onClick={() => setLightboxIdx(null)}
          >
            <button
              onClick={() => setLightboxIdx(null)}
              className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-4">
              {lightboxIdx > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    lightboxNavigate(-1);
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
              <div
                className="relative flex max-h-[85vh] max-w-[85vw] items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={photos[lightboxIdx]}
                  alt={`Foto ${lightboxIdx + 1} de ${photoCount}`}
                  className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl"
                />
              </div>
              {lightboxIdx < photoCount - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    lightboxNavigate(1);
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
              {lightboxIdx + 1} / {photoCount}
            </div>
          </div>
        )}

        {/* ── CONTENT + SIDEBAR ── */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* ── MAIN CONTENT ── */}
          <div className="space-y-10">
            {/* Tags */}
            <div className="animate-slide-up flex flex-wrap items-center gap-2 delay-1">
              <span
                className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white ${
                  p.operacion === "Venta"
                    ? "bg-[oklch(0.32_0.08_255)]"
                    : "bg-[oklch(0.45_0.15_25)]"
                }`}
              >
                {p.operacion}
              </span>
              <span className="rounded-full border border-border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider">
                {p.tipo}
              </span>
              <span className="rounded-full border border-border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[oklch(0.32_0.08_255)]">
                {p.barrio}
              </span>
              {p.aptoBanco && (
                <span className="rounded-full bg-[oklch(0.55_0.15_150)] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
                  Apto banco
                </span>
              )}
              {p.permuta && (
                <span className="rounded-full bg-[oklch(0.45_0.15_25)] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
                  Permuta
                </span>
              )}
            </div>

            {/* Price + Address */}
            <div className="animate-slide-up delay-2">
              <h1 className="font-display text-5xl font-bold tracking-tight text-[oklch(0.78_0.13_80)]">
                {formatPriceFromProperty(p)}
              </h1>
              <p className="mt-2 text-lg text-foreground">{p.direccion}</p>
              <p className="text-sm text-muted-foreground">
                {p.barrio}, {p.ciudad}
              </p>
            </div>

            {/* Key Specs — Grouped */}
            <div className="animate-slide-up delay-3">
              <h2 className="font-display text-xl font-semibold">
                Características
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SpecCard
                  icon={<Maximize2 className="h-5 w-5" />}
                  value={`${p.m2Totales} m²`}
                  label="Totales"
                />
                <SpecCard
                  icon={<Home className="h-5 w-5" />}
                  value={`${p.m2Cubiertos} m²`}
                  label="Cubiertos"
                />
                {p.m2Terreno && (
                  <SpecCard
                    icon={<Ruler className="h-5 w-5" />}
                    value={`${p.m2Terreno} m²`}
                    label="Terreno"
                  />
                )}
                {p.m2Descubierta && (
                  <SpecCard
                    icon={<Ruler className="h-5 w-5" />}
                    value={`${p.m2Descubierta} m²`}
                    label="Descubierta"
                  />
                )}
                <SpecCard
                  icon={<Bed className="h-5 w-5" />}
                  value={`${p.dormitorios}`}
                  label="Dormitorios"
                />
                <SpecCard
                  icon={<Bath className="h-5 w-5" />}
                  value={`${p.banos}`}
                  label="Baños"
                />
                <SpecCard
                  icon={<Layers className="h-5 w-5" />}
                  value={`${p.ambientes}`}
                  label="Ambientes"
                />
                {p.cantPlantas && (
                  <SpecCard
                    icon={<Building className="h-5 w-5" />}
                    value={`${p.cantPlantas}`}
                    label="Plantas"
                  />
                )}
                {p.piso && (
                  <SpecCard value={p.piso} label="Piso" />
                )}
                {p.antiguedad && (
                  <SpecCard value={p.antiguedad} label="Antigüedad" />
                )}
                {p.expensas && (
                  <SpecCard value={p.expensas} label="Expensas" />
                )}
              </div>
            </div>

            {/* Description */}
            {p.descripcion && (
              <div className="animate-slide-up delay-4">
                <h2 className="font-display text-xl font-semibold">
                  Descripción
                </h2>
                <p className="mt-3 leading-relaxed text-foreground/80">
                  {p.descripcion}
                </p>
              </div>
            )}

            {/* Amenities */}
            {(amenityIcons.length > 0 || extraAmenities.length > 0) && (
              <div className="animate-slide-up delay-4">
                <h2 className="font-display text-xl font-semibold">
                  Comodidades
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {amenityIcons.map((a) => (
                    <span
                      key={a.label}
                      className="inline-flex items-center gap-2 rounded-xl border border-[oklch(0.78_0.13_80/0.2)] bg-[oklch(0.78_0.13_80/0.06)] px-4 py-2 text-sm font-medium"
                    >
                      <a.icon className="h-4 w-4 text-[oklch(0.78_0.13_80)]" />
                      {a.label}
                    </span>
                  ))}
                  {extraAmenities.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-2 text-sm"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Detalles */}
            {p.detalles && Object.keys(p.detalles).length > 0 && (
              <div className="animate-slide-up delay-5">
                <h2 className="font-display text-xl font-semibold">
                  Detalles
                </h2>
                <div className="mt-4 space-y-4">
                  {Object.entries(p.detalles).map(([seccion, items]) => (
                    <div key={seccion}>
                      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                        {seccion}
                      </h3>
                      <div className="overflow-hidden rounded-xl border border-border">
                        {items.map((item, idx) => (
                          <div
                            key={item.clave}
                            className={`flex items-center justify-between px-5 py-2.5 text-sm ${
                              idx % 2 === 0 ? "bg-muted/30" : ""
                            }`}
                          >
                            <span className="text-muted-foreground">
                              {item.clave}
                            </span>
                            <span className="font-medium text-foreground">
                              {item.valor}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {hasMap && (
              <div className="animate-slide-up delay-5">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[oklch(0.32_0.08_255)]" />
                  <h2 className="font-display text-xl font-semibold">
                    Ubicación
                  </h2>
                </div>
                <div className="mt-4">
                  <div
                    ref={mapRef}
                    className="h-[320px] w-full overflow-hidden rounded-2xl"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="animate-slide-up rounded-2xl border border-border bg-card p-6 delay-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.32_0.08_255)] font-display text-lg font-bold text-white">
                  CP
                </div>
                <div>
                  <div className="font-semibold">Comensaña Propiedades</div>
                  <div className="text-xs text-muted-foreground">
                    +54 9 221 555 1234
                  </div>
                </div>
              </div>
              <a
                href={`https://wa.me/${WHATSAPP}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[oklch(0.55_0.15_150)] py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                <MessageCircle className="h-4 w-4" />
                Consultar por WhatsApp
              </a>
              <button
                onClick={() => {
                  navigator
                    .share?.({
                      title: propertyTitle(p),
                      url: window.location.href,
                    })
                    .catch(() => {
                      navigator.clipboard.writeText(window.location.href);
                    });
                }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold transition hover:bg-muted"
              >
                <Share2 className="h-4 w-4" />
                Compartir
              </button>
              <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-border p-4">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  QR de la propiedad
                </div>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${SITE_URL}/propiedad/${p.id}`)}`}
                  alt="QR de la propiedad"
                  className="h-24 w-24"
                />
              </div>
            </div>

            <div className="animate-slide-up rounded-2xl border border-border bg-card p-6 delay-3">
              <h3 className="font-display text-lg font-semibold">
                Consultá por esta propiedad
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Respondemos al instante por WhatsApp
              </p>
              <div className="mt-4 space-y-2">
                <a
                  href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola! Quiero visitar la propiedad en ${p.direccion}, ${p.barrio} (${p.ciudad}). Precio: ${formatPriceFromProperty(p)}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[oklch(0.55_0.15_150)] py-3 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  <Navigation className="h-4 w-4" />
                  Quiero visitar
                </a>
                <a
                  href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola! Me interesa la propiedad en ${p.direccion}, ${p.barrio} (${p.ciudad}). Precio: ${formatPriceFromProperty(p)}. Necesito más información.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold transition hover:bg-muted"
                >
                  <MessageCircle className="h-4 w-4" />
                  Más información
                </a>
                <a
                  href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola! Quiero saber el precio de la propiedad en ${p.direccion}, ${p.barrio} (${p.ciudad}): ${formatPriceFromProperty(p)}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold transition hover:bg-muted"
                >
                  <Phone className="h-4 w-4" />
                  Consultar precio
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function SpecCard({
  icon,
  value,
  label,
}: {
  icon?: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition hover:border-[oklch(0.78_0.13_80/0.3)]">
      {icon && (
        <div className="mb-2 text-[oklch(0.32_0.08_255)]">{icon}</div>
      )}
      <div className="font-display text-lg font-bold">{value}</div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
