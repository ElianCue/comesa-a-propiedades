import { formatPriceFromProperty, propertyTitle, createPropertySlug, SITE_URL, type Property } from "@comesana/shared";

export async function sendPropertyAlert(
  to: string,
  property: Property
): Promise<boolean> {
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY || "");
    const FROM = process.env.ALERT_FROM_EMAIL || "propiedades@comesana.com";

    const propertyUrl = `${SITE_URL}/propiedad/${createPropertySlug(property)}`;

    await resend.emails.send({
      from: `Comensaña Propiedades <${FROM}>`,
      to,
      subject: `Nueva propiedad: ${propertyTitle(property)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#0e0e12;font-family:DM Sans,Helvetica,Arial,sans-serif">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e12;padding:32px 16px">
            <tr>
              <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1a1a22;border-radius:20px;overflow:hidden">
                  <tr>
                    <td style="padding:32px 32px 0;text-align:center">
                      <h1 style="margin:0;font-family:Playfair Display,Georgia,serif;font-size:22px;font-weight:700;color:#f5e6c8;letter-spacing:-0.3px">Comensaña Propiedades</h1>
                      <p style="margin:6px 0 0;font-size:13px;color:#8a8a9a">Nueva propiedad disponible</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 32px 0">
                      <img src="${property.fotos[0] || ""}" alt="" width="496" height="280" style="width:100%;height:auto;border-radius:14px;object-fit:cover;display:block" />
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 32px 0">
                      <h2 style="margin:0;font-family:Playfair Display,Georgia,serif;font-size:32px;font-weight:700;color:#f5e6c8;letter-spacing:-1px">${formatPriceFromProperty(property)}</h2>
                      <p style="margin:8px 0 0;font-size:15px;color:#e4e4ed">${property.direccion}</p>
                      <p style="margin:2px 0 0;font-size:13px;color:#8a8a9a">${property.barrio}, ${property.ciudad}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 32px 0">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          ${[
                            { label: "Superficie", value: `${property.m2Totales} m²` },
                            { label: "Dormitorios", value: `${property.dormitorios}` },
                            { label: "Baños", value: `${property.banos}` },
                          ]
                            .map(
                              (s) => `
                            <td align="center" style="padding:12px 8px;background:#25252f;border-radius:10px;width:33.33%">
                              <div style="font-size:18px;font-weight:700;color:#f5e6c8">${s.value}</div>
                              <div style="font-size:10px;color:#8a8a9a;text-transform:uppercase;letter-spacing:1px;margin-top:2px">${s.label}</div>
                            </td>`
                            )
                            .join("")}
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 32px 0">
                      <p style="margin:0;font-size:13px;line-height:1.6;color:#b0b0be">${property.descripcion.substring(0, 200)}${property.descripcion.length > 200 ? "…" : ""}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 32px 32px;text-align:center">
                      <a href="${propertyUrl}" style="display:inline-block;padding:14px 40px;background:oklch(0.32 0.08 255);color:white;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none">Ver propiedad</a>
                      <p style="margin:16px 0 0;font-size:11px;color:#5a5a6a">Si no querés recibir más notificaciones, respondé este email.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    return true;
  } catch (err) {
    console.error("[email] Error sending property alert:", err);
    return false;
  }
}
