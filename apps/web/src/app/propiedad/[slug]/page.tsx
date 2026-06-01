"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { api } from "@/lib/api-client";
import { formatPrice, WHATSAPP, propertyTitle, propertyDescription, SITE_URL, type Property } from "@/lib/properties";
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
  Send,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface Props {
  params: { slug: string };
}

export default function PropertyPage({ params }: Props) {
  const { slug } = params;
  const [p, setP] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = slug.split("-").pop();
    if (!id) { setLoading(false); return; }
    api.get<any>(`/api/properties/${id}`)
      .then((res) => setP(res?.data ?? null))
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
  // Form state is declared unconditionally so hooks order is stable
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", mensaje: "" });
  const [formSent, setFormSent] = useState(false);
  const [formSending, setFormSending] = useState(false);
  const [formError, setFormError] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
      </div>
    );
  }

  // Form state is hoisted above so hooks order is stable during hydration.

  const submitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p) return;
    setFormSending(true);
    setFormError("");
    try {
      await api.post("/api/inquiries", { property_id: p.id, ...form });
      setFormSent(true);
    } catch {
      setFormError("Error al enviar la consulta. Intente de nuevo.");
    } finally {
      setFormSending(false);
    }
  };

  if (!p) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl px-6 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Propiedad no encontrada</h1>
          <p className="text-muted-foreground mb-6">La propiedad que buscas no existe o fue eliminada.</p>
          <Link href="/" className="text-primary hover:underline">
            Volver al listado
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const waText = encodeURIComponent(
    `Hola! Me interesa la propiedad en ${p.direccion}, ${p.barrio} (${p.ciudad}) publicada en Comensaña Propiedades. Precio: ${formatPrice(p)}`
  );

  const amenities = [
    p.cochera && { icon: Car, label: "Cochera" },
    p.jardin && { icon: Trees, label: "Jardín" },
    p.parrilla && { icon: Flame, label: "Parrilla" },
    p.pileta && { icon: Waves, label: "Pileta" },
    p.balcon && { icon: Home, label: "Balcón" },
  ].filter(Boolean) as { icon: typeof Car; label: string }[];

  // Extra amenities from ArgentProp boolean features
  const extraAmenities: string[] = [];
  if (p.amenities) {
    const known = new Set(["Cochera", "Jardín", "Parrilla", "Pileta", "Balcón"]);
    for (const a of p.amenities) {
      if (!known.has(a)) extraAmenities.push(a);
    }
  }

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
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al listado
        </Link>

        <div className="grid grid-cols-4 gap-2">
          <div className="relative col-span-4 aspect-[4/3] overflow-hidden rounded-xl bg-muted md:col-span-2 md:row-span-2">
            {p.fotos && p.fotos[0] ? (
              <Image
                src={p.fotos[0]}
                alt={`${p.tipo} en ${p.barrio}, ${p.ciudad}`}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                Sin foto
              </div>
            )}
          </div>
           {p.fotos.slice(1, 4).map((f, i) => (
            <div
              key={i}
              className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-muted col-span-2 md:col-span-1 ${
                i === 0 ? "md:col-span-2" : ""
              }`}
            >
              {f ? (
                <Image
                  src={f}
                  alt={`${p.tipo} en ${p.barrio} — foto ${i + 2}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                  Sin foto
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white ${
                  p.operacion === "Venta"
                    ? "bg-[oklch(0.32_0.08_255)]"
                    : "bg-[oklch(0.45_0.15_25)]"
                }`}
              >
                {p.operacion}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
                {p.tipo}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.32_0.08_255)]">
                {p.ciudad}
              </span>
              {p.aptoBanco && (
                <span className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white bg-[oklch(0.55_0.15_150)]">
                  Apto banco
                </span>
              )}
              {p.permuta && (
                <span className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white bg-[oklch(0.45_0.15_25)]">
                  Permuta
                </span>
              )}
            </div>
            <h1 className="mt-4 font-display text-5xl font-bold tracking-tight">
              {formatPrice(p)}
            </h1>
            <div className="mt-2 text-lg text-foreground">{p.direccion}</div>
            <div className="text-sm text-muted-foreground">
              {p.barrio}, {p.ciudad}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-4">
              <Spec
                icon={<Maximize2 className="h-5 w-5" />}
                value={`${p.m2Totales} m²`}
                label="Totales"
              />
              <Spec
                icon={<Home className="h-5 w-5" />}
                value={`${p.m2Cubiertos} m²`}
                label="Cubiertos"
              />
              <Spec
                icon={<Bed className="h-5 w-5" />}
                value={`${p.dormitorios}`}
                label="Dormitorios"
              />
              <Spec
                icon={<Bath className="h-5 w-5" />}
                value={`${p.banos}`}
                label="Baños"
              />
              <Spec value={`${p.ambientes}`} label="Ambientes" />
              <Spec value={p.cochera ? "Sí" : "No"} label="Cochera" />
              {p.piso && <Spec value={p.piso} label="Piso" />}
              {p.antiguedad && <Spec value={p.antiguedad} label="Antigüedad" />}
              {p.m2Terreno && <Spec value={`${p.m2Terreno} m²`} label="Terreno" />}
              {p.m2Descubierta && <Spec value={`${p.m2Descubierta} m²`} label="Descubierta" />}
              {p.cantPlantas && <Spec value={`${p.cantPlantas}`} label="Plantas" />}
              {p.expensas && <Spec value={p.expensas} label="Expensas" />}
            </div>

            <div className="mt-8">
              <h2 className="font-display text-2xl font-semibold">Descripción</h2>
              <p className="mt-3 leading-relaxed text-foreground/80">
                {p.descripcion}
              </p>
            </div>

            {amenities.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-2xl font-semibold">Comodidades</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {amenities.map((a) => (
                    <span
                      key={a.label}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2 text-sm"
                    >
                      <a.icon className="h-4 w-4" />
                      {a.label}
                    </span>
                  ))}
                  {extraAmenities.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2 text-sm"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {p.detalles && Object.keys(p.detalles).length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-2xl font-semibold">Detalles</h2>
                <div className="mt-3 grid gap-6">
                  {Object.entries(p.detalles).map(([seccion, items]) => (
                    <div key={seccion}>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        {seccion}
                      </h3>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 rounded-xl border border-border bg-card p-4 text-sm sm:grid-cols-3">
                        {items.map((item) => (
                          <div key={item.clave} className="flex justify-between gap-2">
                            <span className="text-muted-foreground">{item.clave}</span>
                            <span className="font-medium text-foreground">{item.valor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6">
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
                  navigator.share?.({
                    title: propertyTitle(p),
                    url: window.location.href,
                  }).catch(() => {
                    navigator.clipboard.writeText(window.location.href);
                  });
                }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold transition hover:bg-muted"
              >
                <Share2 className="h-4 w-4" />
                Compartir
              </button>
              {/* QR */}
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

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-semibold">Consultá por esta propiedad</h3>
              {formSent ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-[oklch(0.55_0.15_150)]">
                  <CheckCircle2 className="h-5 w-5" />
                  Consulta enviada con éxito
                </div>
              ) : (
                <form onSubmit={submitInquiry} className="mt-4 space-y-3">
                  <input
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Nombre *"
                    required
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Email *"
                    required
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                  />
                  <input
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="Teléfono"
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                  />
                  <textarea
                    value={form.mensaje}
                    onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                    placeholder="Mensaje"
                    rows={3}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                  />
                  {formError && <div className="text-xs text-destructive">{formError}</div>}
                  <button
                    disabled={formSending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-50"
                  >
                    {formSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Enviar consulta
                  </button>
                </form>
              )}
            </div>
          </aside>
        </div>


      </div>

      <Footer />
    </div>
  );
}

function Spec({
  icon,
  value,
  label,
}: {
  icon?: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div>
      {icon && <div className="mb-1 text-[oklch(0.32_0.08_255)]">{icon}</div>}
      <div className="font-display text-xl font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
