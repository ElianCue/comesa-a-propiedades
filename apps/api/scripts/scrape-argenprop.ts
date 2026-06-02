import * as cheerio from "cheerio";
import { readFileSync, existsSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

// ── Load .env ──
// Load both root .env and apps/api/.env (apps/api/.env should override root vars)
const CWD = process.cwd();
const envPaths = [path.resolve(CWD, ".env"), path.resolve(CWD, "apps/api/.env")];
for (const p of envPaths) {
  if (!existsSync(p)) continue;
  const content = readFileSync(p, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      // If this is the apps/api/.env file, allow it to override existing env vars.
      if (p.endsWith(path.join("apps", "api", ".env"))) {
        process.env[key] = value;
      } else if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

const CLOUDINARY_URL = process.env.CLOUDINARY_URL || "";
const cloudMatch = CLOUDINARY_URL.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
if (cloudMatch) {
  cloudinary.config({
    cloud_name: cloudMatch[3],
    api_key: cloudMatch[1],
    api_secret: cloudMatch[2],
  });
}

// ── Types ──
interface RawListing {
  id: string;
  detailUrl: string;
  tipo: string;
  operacion: string;
  moneda: string;
  precio: number | null;
  direccion: string;
  barrio: string;
  ciudad: string;
  m2Cubiertos: number;
  dormitorios: number;
  antiguedad: string;
  titulo: string;
  descripcion: string;
  fotosChico: string[];
  aptoBancoCard: boolean;
  permutaCard: boolean;
  expensasCard: string;
}

interface EnrichedProperty {
  id: string;
  direccion: string;
  precio: number | null;
  moneda: string;
  tipo: string;
  operacion: string;
  ciudad: string;
  barrio: string;
  m2Totales: number;
  m2Cubiertos: number;
  m2Terreno: number;
  m2Descubierta: number;
  ambientes: number;
  dormitorios: number;
  banos: number;
  cantPlantas: number;
  descripcion: string;
  lat: number | null;
  lng: number | null;
  antiguedad: string;
  piso: string;
  cochera: boolean;
  balcon: boolean;
  jardin: boolean;
  parrilla: boolean;
  pileta: boolean;
  aptoBanco: boolean;
  permuta: boolean;
  expensas: string;
  fotos: string[];
  detalles: Record<string, string>;
  amenitiesExtra: string[];
}

// ── Constants ──
const BASE_URL = "https://www.argenprop.com";
const AGENT_PATH = "/inmobiliarias/paola-comesana-propiedades";
const DELAY_MS = 1500;
const REQUEST_TIMEOUT = 30000;
const CLOUDINARY_FOLDER = "comesana-propiedades";
const CSV_PATH = path.resolve(CWD, "datos-argenprop.csv");

const TIPO_MAP: Record<string, string> = {
  "1": "Depto", "2": "Casa", "3": "PH", "4": "Terreno", "5": "Local",
  "6": "Campo", "7": "Cochera", "8": "Fondo Comercio", "9": "Galpon",
  "10": "Hotel", "11": "Negocio Especial", "12": "Oficina", "13": "Quinta",
};

const OP_MAP: Record<string, string> = { "1": "Venta", "2": "Alquiler" };
const MONEDA_MAP: Record<string, string> = { "1": "ARS", "2": "USD" };

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
  Cookie: process.env.ARGENPROP_COOKIE || "",
  Referer: "https://www.argenprop.com/",
};

// ── CLI args ──
const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_CLOUDINARY = process.argv.includes("--skip-cloudinary") || DRY_RUN;
const GEOCODE = process.argv.includes("--geocode");
const MAX_PAGES = (() => {
  const idx = process.argv.indexOf("--max-pages");
  if (idx !== -1 && idx + 1 < process.argv.length)
    return parseInt(process.argv[idx + 1], 10) || 5;
  return 5;
})();

// ── Helpers ──
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(
  url: string,
  retries = 3
): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      const res = await fetch(url, {
        headers: HEADERS,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err: any) {
      const isLast = i === retries - 1;
      const msg = err?.message || String(err);
      if (!isLast) {
        console.log(`    ⚠ Reintento ${i + 1}/${retries}: ${msg}`);
        await delay(DELAY_MS * 2);
      } else {
        console.log(`    ✗ Error tras ${retries} intentos: ${msg}`);
        return null;
      }
    }
  }
  return null;
}

function upgradeImgUrl(url: string): string {
  return url
    .replace(/_u_small\./g, "_u_medium.")
    .replace(/_u_chico\./g, "_u_medium.");
}

function clean(t: string): string {
  return t.replace(/\s+/g, " ").trim();
}

function dedupPhotos(urls: string[]): string[] {
  // Deduplicate by UUID, preferring larger sizes
  const best = new Map<string, string>();
  for (const url of urls) {
    const m = url.match(/static-content\/([^/]+)\/([a-f0-9-]+)/);
    if (m) {
      const uuid = m[2];
      const existing = best.get(uuid);
      if (!existing || rankSize(url) > rankSize(existing)) {
        best.set(uuid, url);
      }
    } else if (!best.has(url)) {
      best.set(url, url);
    }
  }
  return [...best.values()];
}

function rankSize(url: string): number {
  if (url.includes("_u_large")) return 4;
  if (!url.includes("_u_")) return 3;
  if (url.includes("_u_medium")) return 2;
  if (url.includes("_u_small") || url.includes("_u_chico")) return 1;
  return 0;
}

function parseCoord(val: string | undefined | null): number | null {
  if (!val) return null;
  const n = parseFloat(val.replace(",", "."));
  return isNaN(n) ? null : n;
}

function csv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function parseCityBarrio(titlePrimary: string, direccion: string): { ciudad: string; barrio: string } {
  let ciudad = "La Plata";
  let barrio = "";

  const text = titlePrimary || direccion;
  const tLow = text.toLowerCase();

  if (tLow.includes("mar del plata")) ciudad = "Mar del Plata";

  // Title format: "Departamento en Venta en Centro, Mar del Plata"
  // Extract barrio from text after last " en " before the comma
  const parts = text.split(",");
  if (parts.length >= 2) {
    const beforeComma = parts[0].trim();
    const enParts = beforeComma.split(" en ");
    if (enParts.length >= 2) {
      barrio = enParts[enParts.length - 1].trim();
    }
  } else {
    // Single-part title, try to extract barrio after " en "
    const enParts = text.split(" en ");
    if (enParts.length >= 2) {
      barrio = enParts[enParts.length - 1].trim();
    }
  }

  // Normalize common barrio names
  const bLow = barrio.toLowerCase();
  if (bLow === "microcentro" && ciudad === "La Plata") barrio = "Centro";
  if (bLow === "ciudad") barrio = "Centro";
  if (/^centro\s/.test(bLow)) barrio = "Centro";
  if (bLow === "manuel b gonnet" || bLow === "gonnet") barrio = "Gonnet";
  if (bLow === "la perla sur") barrio = "La Perla";
  if (bLow === "lisandro olmos etcheverry") barrio = "Lisandro Olmos";
  if (bLow.includes("partido de")) barrio = "";

  return { ciudad, barrio };
}

function parseTipoFromTitle(titlePrimary: string, fallbackCod: string): string {
  // Title format: "Departamento en Venta en Centro, Mar del Plata"
  // Extract type as everything before the first " en "
  const parts = titlePrimary.split(" en ");
  if (parts.length >= 1) {
    const rawType = parts[0].trim().toLowerCase();
    const TITLE_TIPO_MAP: Record<string, string> = {
      departamento: "Depto",
      casa: "Casa",
      ph: "PH",
      terreno: "Terreno",
      local: "Local",
      campo: "Campo",
      oficina: "Oficina",
      hotel: "Hotel",
      "negocio especial": "Negocio Especial",
      negocio: "Negocio Especial",
      quinta: "Quinta",
      "fondo comercio": "Fondo Comercio",
      "fondo de comercio": "Fondo Comercio",
      cochera: "Cochera",
      galpón: "Galpon",
      galpon: "Galpon",
    };
    if (TITLE_TIPO_MAP[rawType]) return TITLE_TIPO_MAP[rawType];
    // Partial match for two-word types like "Fondo Comercio"
    for (const [key, val] of Object.entries(TITLE_TIPO_MAP)) {
      if (rawType.startsWith(key)) return val;
    }
  }
  return TIPO_MAP[fallbackCod] || "Depto";
}

// ── Phase 1: Scrape listing pages ──
async function scrapeListings(): Promise<RawListing[]> {
  console.log("\n═══════ Fase 1: Scrapeando listados ═══════\n");

  const all: RawListing[] = [];
  let page = 1;

  while (page <= MAX_PAGES) {
    const url =
      page === 1
        ? `${BASE_URL}${AGENT_PATH}`
        : `${BASE_URL}${AGENT_PATH}?pagina-${page}`;
    console.log(`  Pagina ${page}...`);

    const html = await fetchWithRetry(url);
    if (!html) {
      console.log("  ✗ No se pudo obtener la pagina.");
      break;
    }

    const $ = cheerio.load(html);
    const cards = $('a.card[data-item-card]');
    if (cards.length === 0) {
      console.log("  ✓ No hay mas propiedades.");
      break;
    }

    cards.each((_, el) => {
      const $el = $(el);
      const id = $el.attr("data-item-card") || "";
      const href = $el.attr("href") || "";
      const detailUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
      const tipoCod = $el.attr("idtipopropiedad") || "";
      const opCod = $el.attr("idtipooperacion") || "";
      const monedaCod = $el.attr("idmoneda") || "";
      const precioRaw = $el.attr("montonormalizado") || "0";
      const dormsRaw = $el.attr("dormitorios") || "0";

      const address = clean($el.find(".card__address").text());
      const titlePrimary = clean($el.find(".card__title--primary").text());

      const dataBarrio = clean($el.attr("data-barrio") || "");
      let ciudad: string, barrio: string;
      if (dataBarrio && dataBarrio !== "" && !/^partido de/i.test(dataBarrio)) {
        const parsed = parseCityBarrio(titlePrimary, address);
        ciudad = parsed.ciudad;
        // Detect if data-barrio is actually a city name (e.g. "La Plata" as barrio)
        const dLow = dataBarrio.toLowerCase();
        if (["la plata", "mar del plata", "santa teresita"].includes(dLow)) {
          ciudad = dataBarrio;
          barrio = "Centro";
        } else {
          barrio = dataBarrio;
        }
      } else {
        const parsed = parseCityBarrio(titlePrimary, address);
        ciudad = parsed.ciudad;
        barrio = parsed.barrio;
        // Filter out city names mistakenly parsed as barrio
        const bLow = barrio.toLowerCase();
        if (["la plata", "mar del plata", "santa teresita"].includes(bLow)) {
          barrio = "";
        }
      }

      const features: string[] = [];
      $el.find(".card__main-features li span").each((_, span) => {
        features.push(clean($(span).text()));
      });

      let m2Cubiertos = 0;
      let dormitorios = parseInt(dormsRaw, 10) || 0;
      let antiguedad = "";
      const expensasCard = clean($el.find(".card__expenses").text());

      for (const f of features) {
        const fLow = f.toLowerCase();
        if (fLow.includes("m")) {
          const m = parseFloat(f.replace(/[^0-9.,]/g, "").replace(",", "."));
          if (!isNaN(m)) m2Cubiertos = Math.round(m);
        } else if (fLow.includes("dor")) {
          const d = parseInt(f, 10);
          if (!isNaN(d)) dormitorios = d;
        } else if ((fLow.includes("años") || fLow.includes("antig")) && !fLow.includes("baños") && !fLow.includes("baño")) {
          antiguedad = f;
        }
      }

      const titulo = clean($el.find("h2.card__title").text());
      const descripcion = clean($el.find("p.card__info").text());

      const fotosChico: string[] = [];
      $el.find(".card__photos li img").each((_, img) => {
        const src = $(img).attr("src") || $(img).attr("data-src") || "";
        if (src.includes("static-content")) fotosChico.push(src);
      });

      // Card-level amenity hints from img alt text (fallback before detail)
      let aptoBancoCard = false;
      let permutaCard = false;
      $el.find(".card__photos li img[alt]").each((_, img) => {
        const alt = ($(img).attr("alt") || "").toLowerCase();
        if (/apto\s*(profesional|crédito|credito)/.test(alt)) aptoBancoCard = true;
        if (/permuta/.test(alt)) permutaCard = true;
      });

      const tipo = parseTipoFromTitle(titlePrimary, tipoCod);

      all.push({
        id,
        detailUrl,
        tipo,
        operacion: OP_MAP[opCod] || "Venta",
        moneda: MONEDA_MAP[monedaCod] || "USD",
        precio: parseInt(precioRaw, 10) || null,
        direccion: address,
        barrio,
        ciudad,
        m2Cubiertos,
        dormitorios,
        antiguedad,
        titulo,
        descripcion,
        fotosChico,
        aptoBancoCard,
        permutaCard,
        expensasCard,
      });
    });

    console.log(`  → ${cards.length} propiedades`);

    // Pagination check
    const hasNext = $(".pagination__page-next:not(.pagination__page--disable)").length > 0;
    if (!hasNext) break;
    page++;
    await delay(DELAY_MS);
  }

  console.log(`\n  ✓ Total: ${all.length} propiedades.\n`);
  return all;
}

// ── Phase 2: Scrape detail pages ──
async function scrapeDetails(listings: RawListing[]): Promise<EnrichedProperty[]> {
  // In dry-run we still fetch detail pages to attempt to collect gallery images
  if (DRY_RUN) {
    console.log("  ▶ Modo dry-run: se procesarán detalles (solo para enriquecer fotos).\n");
  }

  console.log("═══════ Fase 2: Scrapeando detalles ═══════\n");

  const enriched: EnrichedProperty[] = [];
  let count = 0;

  for (const l of listings) {
    count++;
    const pct = ((count / listings.length) * 100).toFixed(0);
    console.log(`  [${count}/${listings.length} (${pct}%)] ${l.id}`);

    const html = await fetchWithRetry(l.detailUrl);

    let banos = 0;
    let ambientes = 0;
    let m2Cubiertos = l.m2Cubiertos;
    let m2Totales = l.m2Cubiertos;
    let m2Terreno = 0;
    let m2Descubierta = 0;
    let cantPlantas = 0;
    let piso = "";
    let lat: number | null = null;
    let lng: number | null = null;
    let cochera = false;
    let balcon = false;
    let jardin = false;
    let parrilla = false;
    let pileta = false;
    let aptoBanco = l.aptoBancoCard;
    let permuta = l.permutaCard;
    let descripcion = l.descripcion;
    let antiguedad = l.antiguedad;
    let expensas = l.expensasCard;
    let fotos: string[] = [];
    const detalles: Record<string, string> = {};
    const amenitiesExtra: string[] = [];

      if (html) {
        const $ = cheerio.load(html);

      // Description
      const detailDesc = clean($("section#description p").first().text());
      if (detailDesc) descripcion = detailDesc;

      // Parse ALL structured specs from property-features sections
      $('ul.property-features').each((_, ul) => {
        const $ul = $(ul);
        // Find the nearest preceding h2 section title
        const $h2 = $ul.prevAll('h2').first();
        const sectionTitle = clean($h2.text()) || 'General';

        $ul.find('li').each((_, li) => {
          const $li = $(li);
          const $h3 = $li.find('h3');
          const fullText = clean($h3.text());
          const tLow = fullText.toLowerCase();

          if ($li.hasClass('property-features-item')) {
            // Boolean checklist item
            if (/cochera/.test(tLow) || /box/.test(tLow) || /garage/.test(tLow)) cochera = true;
            else if (/balc/.test(tLow)) balcon = true;
            else if (/jard(in|ín)/.test(tLow) || /parque/.test(tLow)) jardin = true;
            else if (/parrilla/.test(tLow) || /quincho/.test(tLow)) parrilla = true;
            else if (/pileta/.test(tLow) || /piscina/.test(tLow)) pileta = true;
            else if (/(apto.*(cred|cré|prof))/i.test(tLow)) aptoBanco = true;
            else if (/permuta/.test(tLow)) permuta = true;
            else {
              amenitiesExtra.push(fullText);
            }
          } else {
            const $strong = $h3.find('strong');
            if ($strong.length > 0) {
              const strongText = clean($strong.text());
              const labelText = fullText.replace(strongText, '').replace(/:$/, '').trim();

              if (labelText) {
                const lLow = labelText.toLowerCase();
                if (/baños?\b/.test(lLow) || /toilette/.test(lLow)) {
                  const m = strongText.match(/(\d+)/); if (m) banos = parseInt(m[1], 10);
                } else if (/ambiente/.test(lLow)) {
                  const m = strongText.match(/(\d+)/); if (m) ambientes = parseInt(m[1], 10);
                } else if (/sup\.?\s*cubierta/.test(lLow)) {
                  const m = strongText.match(/([\d.,]+)/); if (m) m2Cubiertos = Math.round(parseFloat(m[1].replace(",", ".")));
                } else if (/sup\.?\s*total/.test(lLow)) {
                  const m = strongText.match(/([\d.,]+)/); if (m) m2Totales = Math.round(parseFloat(m[1].replace(",", ".")));
                } else if (/sup\.?\s*terreno/.test(lLow)) {
                  const m = strongText.match(/([\d.,]+)/); if (m) m2Terreno = Math.round(parseFloat(m[1].replace(",", ".")));
                } else if (/sup\.?\s*descubierta/.test(lLow)) {
                  const m = strongText.match(/([\d.,]+)/); if (m) m2Descubierta = Math.round(parseFloat(m[1].replace(",", ".")));
                } else if (/antiguedad/.test(lLow)) {
                  const m = strongText.match(/(\d+)/); if (m) antiguedad = `${m[1]} años`;
                } else if (/^piso\b/.test(lLow)) {
                  piso = strongText;
                } else if (/plantas/.test(lLow)) {
                  const m = strongText.match(/(\d+)/); if (m) cantPlantas = parseInt(m[1], 10);
                } else if (/expensas/.test(lLow)) {
                  expensas = strongText;
                } else {
                  detalles[labelText] = strongText;
                }
              } else {
                // Boolean without label
                const sLow = strongText.toLowerCase();
                if (sLow.includes("apto profesional") || sLow.includes("apto crédito") || sLow.includes("apto credito")) aptoBanco = true;
                else if (sLow.includes("permuta")) permuta = true;
                else {
                  amenitiesExtra.push(strongText);
                }
              }
            }
          }
        });
      });

      // Fallback: property-main-features top bar (icon pills)
      $("ul.property-main-features li[title]").each((_, li) => {
        const $li = $(li);
        const title = ($li.attr("title") || "").toLowerCase();
        const val = clean($li.find(".strong").text());
        // Only set values if not already extracted from property-features above
        if (/sup\.?\s*cubierta/.test(title) && m2Cubiertos === l.m2Cubiertos) {
          const m = val.match(/([\d.,]+)/);
          if (m) m2Cubiertos = Math.round(parseFloat(m[1].replace(",", ".")));
        }
        if (/baños?\b/.test(title) && banos === 0) {
          const m = val.match(/(\d+)/);
          if (m) banos = parseInt(m[1], 10);
        }
        if (/dormitorios/.test(title) && l.dormitorios === 0) {
          const m = val.match(/(\d+)/);
          if (m) l.dormitorios = parseInt(m[1], 10); // update the listing-level value
        }
        if (/(antig|años)/.test(title) && !antiguedad) {
          const m = val.match(/(\d+)/);
          if (m) antiguedad = `${m[1]} años`;
        }
      });

      // Check description for permuta
      if (!permuta) {
        const dLow = descripcion.toLowerCase();
        if (/permuta/.test(dLow) || /toma\s/.test(dLow)) permuta = true;
      }

      // Hero images
      $(".hero-image [data-open-gallery]").each((_, el) => {
        const style = $(el).attr("style") || "";
        const m = style.match(/url\(([^)]+)\)/);
        if (m) {
          const url = m[1].replace(/['"]/g, "");
          if (url.includes("static-content") && !fotos.includes(url)) fotos.push(url);
        }
      });

      // JSON-LD image
      $('script[type="application/ld+json"]').each((_, script) => {
        try {
          const json = JSON.parse($(script).html() || "{}");
          if (typeof json.image === "string" && json.image.includes("static-content")) {
            if (!fotos.includes(json.image)) fotos.unshift(json.image);
          }
        } catch {}
      });

      // Gallery partial — only actual gallery carousel images (no UI icons)
      const galleryUrl = $("[data-url-get-gallery]").attr("data-url-get-gallery");
      if (galleryUrl) {
        const fullUrl = galleryUrl.startsWith("http") ? galleryUrl : `${BASE_URL}${galleryUrl}`;
        const galleryHtml = await fetchWithRetry(fullUrl);
        if (galleryHtml) {
          const $g = cheerio.load(galleryHtml);
          $g("ul.gallery-content[data-gallery-carousel] li img").each((_, img) => {
            const src = $g(img).attr("data-src") || $g(img).attr("src") || "";
            if (src.includes("static-content") && !fotos.includes(src)) {
              fotos.push(src);
            }
          });
        }
      }

      // Extra image sources: og:image, link rel=image_src, and any reasonable img[src]
      try {
        const og = $('meta[property="og:image"]').attr('content') || $('meta[name="og:image"]').attr('content');
        if (og && !fotos.includes(og)) fotos.unshift(og);
      } catch {}

      try {
        const imgLink = $('link[rel="image_src"]').attr('href');
        if (imgLink && !fotos.includes(imgLink)) fotos.unshift(imgLink);
      } catch {}

      // Collect generic <img> elements but filter out icons/svgs and very small URLs
      try {
        $('img').each((_, img) => {
          const src = ($(img).attr('data-src') || $(img).attr('src') || '').trim();
          if (!src) return;
          const low = src.toLowerCase();
          if (low.startsWith('data:')) return; // skip inline images
          if (low.includes('icon') || low.includes('sprite') || low.includes('.svg')) return; // skip UI icons
          if (!low.includes('static-content') && !/\.(jpe?g|png|webp)$/i.test(low)) return; // likely not a real photo
          if (!fotos.includes(src)) fotos.push(src);
        });
      } catch {}

      // Coordinates (Argenprop uses comma as decimal separator, e.g. "-34,94301")
      $("[data-lat], [data-lng], [data-latitude], [data-longitude], [data-latitud], [data-longitud]").each((_, el) => {
        const $el = $(el);
        const ls = $el.attr("data-lat") || $el.attr("data-latitude") || $el.attr("data-latitud") || "";
        const ng = $el.attr("data-lng") || $el.attr("data-longitude") || $el.attr("data-longitud") || "";
        const pl = parseCoord(ls);
        const pn = parseCoord(ng);
        if (pl !== null && pn !== null) {
          lat = pl;
          lng = pn;
        }
      });
    }

    fotos = dedupPhotos(fotos)
      .filter((url) => /^https?:\/\//i.test(url))
      .map(upgradeImgUrl);

    if (ambientes === 0) ambientes = Math.max(l.dormitorios + 1, 2);
    if (banos === 0) banos = Math.max(1, Math.floor(l.dormitorios / 2));

    enriched.push({
      id: l.id,
      direccion: l.direccion,
      precio: l.precio,
      moneda: l.moneda,
      tipo: l.tipo,
      operacion: l.operacion,
      ciudad: l.ciudad,
      barrio: l.barrio,
      m2Totales,
      m2Cubiertos,
      m2Terreno,
      m2Descubierta,
      ambientes,
      dormitorios: l.dormitorios,
      banos,
      cantPlantas,
      descripcion,
      lat,
      lng,
      antiguedad,
      piso,
      cochera,
      balcon,
      jardin,
      parrilla,
      pileta,
      aptoBanco,
      permuta,
      expensas,
      fotos,
      detalles,
      amenitiesExtra,
    });

    if (count < listings.length) await delay(DELAY_MS);
  }

  console.log(`\n  ✓ ${enriched.length} propiedades enriquecidas.\n`);
  return enriched;
}

// ── Phase 3: Upload images to Cloudinary ──
async function uploadImages(
  properties: EnrichedProperty[]
): Promise<EnrichedProperty[]> {
  if (SKIP_CLOUDINARY) {
    console.log("  ▶ Saltando subida a Cloudinary.\n");
    return properties;
  }

  if (!process.env.CLOUDINARY_URL) {
    console.log("  ⚠ CLOUDINARY_URL no configurada. Saltando.\n");
    return properties;
  }

  console.log("═══════ Fase 3: Subiendo imagenes a Cloudinary ═══════\n");

  const result: EnrichedProperty[] = [];
  let totalUploaded = 0;
  let totalErrors = 0;

  for (let i = 0; i < properties.length; i++) {
    const p = properties[i];
    const pct = (((i + 1) / properties.length) * 100).toFixed(0);
    const label = p.direccion || p.descripcion.slice(0, 50);
    console.log(`  [${i + 1}/${properties.length} (${pct}%)] ${p.id} — ${label}`);

    const cloudinaryUrls: string[] = [];

    for (let j = 0; j < p.fotos.length; j++) {
      const imgUrl = p.fotos[j];
      const short = imgUrl.split("/").pop()?.slice(0, 35) || "";
      process.stdout.write(`    ${j + 1}/${p.fotos.length}: ${short}... `);

      try {
        const r = await cloudinary.uploader.upload(imgUrl, {
          folder: CLOUDINARY_FOLDER,
          public_id: `argenprop-${p.id}-${j}`,
        });
        cloudinaryUrls.push(r.secure_url);
        totalUploaded++;
        console.log("OK");
      } catch (err: any) {
        totalErrors++;
        console.log(`ERR (${err?.error?.message || err?.message || "fallo"})`);
      }

      if (j < p.fotos.length - 1) await delay(500);
    }

    result.push({ ...p, fotos: cloudinaryUrls });
    console.log(`    → ${cloudinaryUrls.length}/${p.fotos.length} subidas`);

    if (i < properties.length - 1) await delay(DELAY_MS);
  }

  console.log(`\n  ✓ Subidas: ${totalUploaded} | Errores: ${totalErrors}\n`);
  return result;
}

// ── Phase 4: Generate CSV ──
async function generateCsv(properties: EnrichedProperty[]) {
  console.log("═══════ Fase 4: Generando CSV ═══════\n");

  const header =
    "direccion,precio,moneda,tipo,operacion,ciudad,barrio,m2_totales,m2_cubiertos,m2_terreno,m2_descubierta,ambientes,dormitorios,banos,cant_plantas,expensas,descripcion,lat,lng,antiguedad,piso,cochera,balcon,jardin,parrilla,pileta,apto_banco,permuta,fotos,detalles,amenities_extra";

  const tipos = new Set<string>();
  const rows: string[] = [header];

  for (const p of properties) {
    tipos.add(p.tipo);
    rows.push(
      [
        p.direccion,
        p.precio,
        p.moneda,
        p.tipo,
        p.operacion,
        p.ciudad,
        p.barrio || "Sin barrio",
        p.m2Totales || p.m2Cubiertos,
        p.m2Cubiertos,
        p.m2Terreno || "",
        p.m2Descubierta || "",
        p.ambientes,
        p.dormitorios,
        p.banos,
        p.cantPlantas || "",
        p.expensas || "",
        p.descripcion,
        p.lat ?? "",
        p.lng ?? "",
        p.antiguedad || "",
        p.piso || "",
        p.cochera ? "si" : "no",
        p.balcon ? "si" : "no",
        p.jardin ? "si" : "no",
        p.parrilla ? "si" : "no",
        p.pileta ? "si" : "no",
        p.aptoBanco ? "si" : "no",
        p.permuta ? "si" : "no",
        p.fotos.join("|"),
        JSON.stringify(p.detalles),
        p.amenitiesExtra.join("|"),
      ]
        .map(csv)
        .join(",")
    );
  }

  await writeFile(CSV_PATH, "\uFEFF" + rows.join("\n"), "utf-8");

  console.log(`  Archivo: ${CSV_PATH}`);
  console.log(`  Propiedades: ${properties.length}`);
  console.log(`  Tipos: ${[...tipos].join(", ")}`);
  console.log(`  Archivo listo para revision.\n`);
  console.log("  Siguiente paso:");
  console.log("    1. Revisa datos-argenprop.csv en Excel/Calc");
  console.log("    2. Corrige barrios, completa lat/lng si hace falta");
  console.log("    3. Si hay tipos nuevos en la DB, agregalos al seed");
  console.log("    4. Importa: npx tsx scripts/import-csv.ts --file datos-argenprop.csv\n");
}

// ── Phase 3.5: Geocode addresses with Nominatim ──
async function geocodeProperties(
  properties: EnrichedProperty[]
): Promise<EnrichedProperty[]> {
  if (!GEOCODE) return properties;

  console.log("═══════ Fase 3.5: Geocodificando direcciones ═══════\n");

  const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
  const UA = "ComensanaPropiedadesBot/1.0";

  const result: EnrichedProperty[] = [];

  for (let i = 0; i < properties.length; i++) {
    const p = properties[i];
    const pct = (((i + 1) / properties.length) * 100).toFixed(0);
    console.log(`  [${i + 1}/${properties.length} (${pct}%)] ${p.id}`);

    // Skip if already has coordinates
    if (p.lat !== null && p.lng !== null) {
      console.log(`    ✓ ya tiene coordenadas (${p.lat}, ${p.lng})`);
      result.push(p);
      continue;
    }

    // Build address query
    const parts = [p.direccion, p.barrio, p.ciudad, "Argentina"].filter(Boolean);
    const query = parts.join(", ");
    console.log(`    → geocoding: "${query}"`);

    try {
      const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`;
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
      });

      if (!res.ok) {
        console.log(`    ✗ HTTP ${res.status}`);
        result.push(p);
        continue;
      }

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const rlat = parseFloat(data[0].lat);
        const rlng = parseFloat(data[0].lon);
        if (!isNaN(rlat) && !isNaN(rlng)) {
          p.lat = rlat;
          p.lng = rlng;
          console.log(`    ✓ ${rlat}, ${rlng}`);
        } else {
          console.log(`    ✗ sin resultado`);
        }
      } else {
        console.log(`    ✗ sin resultado`);
      }
    } catch (err: any) {
      console.log(`    ✗ error: ${err?.message || "fallo"}`);
    }

    result.push(p);
    if (i < properties.length - 1) await delay(1000);
  }

  const geocoded = result.filter((p) => p.lat !== null && p.lng !== null).length;
  console.log(`\n  ✓ ${geocoded}/${properties.length} propiedades geocodificadas.\n`);
  return result;
}

// ── Main ──
async function main() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║  Argenprop Scraper - Paola Comesana   ║");
  console.log("╚════════════════════════════════════════╝");

  const flags = [
    DRY_RUN && "dry-run",
    SKIP_CLOUDINARY && "sin-cloudinary",
    GEOCODE && "geocode",
    MAX_PAGES < 5 && `max-pages=${MAX_PAGES}`,
  ].filter(Boolean).join(" ");
  console.log(`  Modo:${flags ? ` ${flags}` : ""}\n`);

  try {
    const listings = await scrapeListings();
    if (listings.length === 0) {
      console.log("  Sin propiedades. Saliendo.");
      return;
    }

    const enriched = await scrapeDetails(listings);
    const geocoded = await geocodeProperties(enriched);
    const withCloudinary = await uploadImages(geocoded);
    await generateCsv(withCloudinary);

    console.log("  LISTO.\n");
  } catch (err: any) {
    console.error("\n  ERROR:", err?.message || err);
    process.exit(1);
  }
}

main();
