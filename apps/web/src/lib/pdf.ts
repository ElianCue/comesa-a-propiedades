import jsPDF from "jspdf";
import QRCode from "qrcode";
import { type Property, formatPrice, SITE_URL, createPropertySlug, WHATSAPP } from "@/lib/properties";

export async function generateQRPDF(p: Property) {
  const slug = createPropertySlug(p);
  const url = `${SITE_URL}/propiedad/${slug}`;

  const qrDataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2, color: { dark: "#1a1a1a", light: "#ffffff" } });

  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const pageW = 210;
  const cx = pageW / 2;

  doc.setFontSize(20);
  doc.text(p.direccion, cx, 25, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`${p.tipo} · ${p.operacion} · ${p.barrio}, ${p.ciudad}`, cx, 34, { align: "center" });

  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text(formatPrice(p.precio, p.moneda), cx, 44, { align: "center" });

  const qs = 90;
  const qx = (pageW - qs) / 2;
  const qy = 55;
  doc.addImage(qrDataUrl, "PNG", qx, qy, qs, qs);

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(url, cx, qy + qs + 8, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(160);
  doc.text("Comensaña Propiedades — La Plata & Mar del Plata", cx, 278, { align: "center" });
  doc.text(`WhatsApp: wa.me/${WHATSAPP}`, cx, 283, { align: "center" });

  doc.save(`QR-${p.direccion.replace(/[\s,/]+/g, "-")}.pdf`);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = src;
  });
}

export async function generateCartelPDF(p: Property) {
  const doc = new jsPDF({ format: "a4", orientation: "landscape", unit: "mm" });
  const pw = 297;
  const ph = 210;
  const slug = createPropertySlug(p);
  const url = `${SITE_URL}/propiedad/${slug}`;

  // ── Load images (up to 6) ──
  const photoUrls = p.fotos.slice(0, 6);
  const photos: HTMLImageElement[] = [];
  for (const src of photoUrls) {
    try { photos.push(await loadImage(src)); } catch { photos.push(new Image()); }
  }

  // ── QR code ──
  const qrDataUrl = await QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark: "#222222", light: "#ffffff" } });

  // ── Page setup ──
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pw, ph, "F");

  // Light border
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.rect(3, 3, pw - 6, ph - 6);

  // ── LAYOUT ──
  const m = 12;
  const gap = 3;
  const cols = 2;
  const photoW = 148;
  const photoAreaH = ph - m * 2;
  const infoX = m + photoW + 8;
  const infoW = pw - infoX - m;

  // ── LEFT: PHOTO GRID ──
  const validPhotos = photos.filter((p) => p.naturalWidth);
  const rows = Math.ceil(validPhotos.length / cols);
  const cellW = (photoW - gap * (cols - 1)) / cols;
  const cellH = rows > 0 ? (photoAreaH - gap * (rows - 1)) / rows : 0;

  validPhotos.forEach((photo, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = m + col * (cellW + gap);
    const cy = m + row * (cellH + gap);

    const ir = photo.naturalWidth / photo.naturalHeight;
    const cr = cellW / cellH;
    let iw: number, ih: number;
    if (cr > ir) { ih = cellH; iw = cellH * ir; }
    else { iw = cellW; ih = cellW / ir; }
    const ix = cx + (cellW - iw) / 2;
    const iy = cy + (cellH - ih) / 2;
    doc.addImage(photo, "JPEG", ix, iy, iw, ih);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.rect(cx, cy, cellW, cellH);
  });

  // Photo count
  if (p.fotos.length > 0) {
    doc.setFillColor(60, 60, 60);
    doc.rect(m + 3, m + 3, 16, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text(`${p.fotos.length} fotos`, m + 4.5, m + 8.5);
  }

  // ── RIGHT: INFO ──
  let y = m + 6;

  // Price
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(formatPrice(p.precio, p.moneda), infoX, y);
  y += 9;

  // Badge + tipo
  doc.setFillColor(60, 60, 60);
  doc.rect(infoX, y, 22, 5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text(p.operacion.toUpperCase(), infoX + 2, y + 3.5);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(p.tipo.toUpperCase(), infoX + 26, y + 3.5);
  y += 10;

  // Address
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  const addrLines = doc.splitTextToSize(p.direccion, infoW);
  doc.text(addrLines, infoX, y);
  y += addrLines.length * 5.5 + 3;

  // Barrio, Ciudad
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${p.barrio}, ${p.ciudad}`, infoX, y);
  y += 9;

  // Expensas
  if (p.expensas) {
    doc.text(`Expensas: ${p.expensas}`, infoX, y);
    y += 7;
  }

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(infoX, y, infoX + infoW, y);
  y += 6;

  // Specs: ambientes | dormitorios | baños | m²
  const specsData = [
    [`${p.ambientes}`, "amb."],
    [`${p.dormitorios}`, "dorm."],
    [`${p.banos}`, "baño"],
    [`${p.m2Totales}`, "m²"],
  ];
  const specW = (infoW - 3) / 4;
  specsData.forEach(([val, label], i) => {
    const sx = infoX + i * (specW + 1);
    doc.setFillColor(245, 245, 245);
    doc.rect(sx, y, specW, 14, "F");
    doc.setDrawColor(215, 215, 215);
    doc.setLineWidth(0.2);
    doc.rect(sx, y, specW, 14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(val, sx + 2.5, y + 6);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text(label.toUpperCase(), sx + 2.5, y + 11);
  });
  y += 19;

  // Extra details
  const extras: string[] = [];
  if (p.m2Cubiertos) extras.push(`${p.m2Cubiertos} m² cub.`);
  if (p.m2Terreno) extras.push(`${p.m2Terreno} m² terr.`);
  if (p.antiguedad) extras.push(p.antiguedad);
  if (p.piso) extras.push(`Piso ${p.piso}`);
  if (extras.length) {
    doc.setTextColor(90, 90, 90);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(extras.join("  |  "), infoX, y);
    y += 8;
  }

  // Amenities
  const amenities: string[] = [];
  if (p.cochera) amenities.push("Cochera");
  if (p.balcon) amenities.push("Balcón");
  if (p.jardin) amenities.push("Jardín");
  if (p.parrilla) amenities.push("Parrilla");
  if (p.pileta) amenities.push("Pileta");
  if (p.aptoBanco) amenities.push("Apto Banco");
  if (p.permuta) amenities.push("Permuta");
  if (amenities.length) {
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(amenities.join("  ·  "), infoX, y);
    y += 8;
  }

  // Description
  if (p.descripcion) {
    doc.setTextColor(90, 90, 90);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const descLines = doc.splitTextToSize(p.descripcion, infoW);
    doc.text(descLines.slice(0, 5), infoX, y);
    y += Math.min(descLines.length, 5) * 3.5 + 6;
  }

  // Push footer down
  const minY = ph - m - 34;
  if (y < minY) y = minY;

  // Footer line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(infoX, y, infoX + infoW, y);
  y += 2;

  // Footer
  doc.setFillColor(248, 248, 248);
  doc.rect(infoX, y, infoW, 28, "F");
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Comensaña Propiedades", infoX + 3, y + 8);
  doc.setTextColor(130, 130, 130);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Martillero y Corredor Público · Col. 7470", infoX + 3, y + 14);
  doc.text("La Plata & Mar del Plata", infoX + 3, y + 18);
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`wa.me/${WHATSAPP}`, infoX + 3, y + 23);

  // QR
  doc.addImage(qrDataUrl, "PNG", infoX + infoW - 22, y + 3, 22, 22);

  doc.save(`Cartel-${p.direccion.replace(/[\s,/]+/g, "-")}.pdf`);
}
