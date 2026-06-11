import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, Instagram, MessageCircle, Navigation } from "lucide-react";
import { WHATSAPP, WHATSAPP_VISITA } from "@/lib/properties";
import logo from "@/assets/images/Logo2.png";

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-card">
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.78_0.13_80/0.5)] to-transparent" />

      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src={logo}
                alt="Comesaña Propiedades"
                className="h-10 w-auto"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-foreground/80">Paola Comesaña</span>
                <span className="text-xs font-medium tracking-wide" style={{ color: "oklch(0.63 0.08 255)" }}>Col. 7470</span>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Propiedades en La Plata y Mar del Plata. Venta y alquiler con asesoramiento profesional.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
              Contacto
            </h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 py-1.5 transition hover:text-[oklch(0.55_0.15_150)]"
              >
                <MessageCircle className="h-4 w-4" />
                +54 9 2215 05-8811
              </a>
              <a
                href={`https://wa.me/${WHATSAPP_VISITA}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 py-1.5 transition hover:text-[oklch(0.55_0.15_150)]"
              >
                <Navigation className="h-4 w-4" />
                +54 9 2215 43-7743
              </a>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                info@comesana.com
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>La Plata, Buenos Aires</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
              Links
            </h4>
            <div className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <Link href="/" className="transition hover:text-foreground py-1.5">
                Inicio
              </Link>
              <Link href="/mapa" className="transition hover:text-foreground py-1.5">
                Mapa de propiedades
              </Link>

            </div>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
              Seguinos
            </h4>
            <div className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <a
                href="https://www.instagram.com/paolacomesaniapropiedades/?theme=dark" target="_blank" rel="noreferrer"
                className="flex items-center gap-2 py-1.5 transition hover:text-foreground"
              >
                <Instagram className="h-4 w-4" />
                @paolacomesaniapropiedades
              </a>
              <a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 py-1.5 transition hover:text-[oklch(0.55_0.15_150)]"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Comesaña Propiedades. Todos los
            derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
