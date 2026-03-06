export interface EmailTemplateData {
  companyName: string;
  url: string;
  avgScore: number;
  hasSSL: boolean;
  hasCookieBanner: boolean;
  hasPrivacyPage: boolean;
  contactFormHasConsent: boolean;
  screenshotUrl: string | null;
  /** Afzender/contactnaam voor ondertekening */
  contactName?: string;
  /** E-mailadres voor ondertekening en mailto-links */
  contactEmail?: string;
}

function scoreColor(score: number): string {
  if (score < 50) return "#dc2626";
  if (score <= 75) return "#ea580c";
  return "#16a34a";
}

export function generateEmailHTML(data: EmailTemplateData): string {
  const {
    companyName,
    avgScore,
    hasSSL,
    hasCookieBanner,
    hasPrivacyPage,
    contactFormHasConsent,
    screenshotUrl,
    contactName = "Onze naam",
    contactEmail = "contact@voorbeeld.nl",
  } = data;

  const color = scoreColor(avgScore);

  const row = (
    label: string,
    ok: boolean
  ) => `<tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${ok ? '<span style="color:#16a34a;">✓</span>' : '<span style="color:#dc2626;">✗</span>'} ${label}</td></tr>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AVG-scan voor ${companyName}</title>
</head>
<body style="margin:0;font-family:Arial,sans-serif;background:#f3f4f6;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;padding:32px 24px;text-align:center;">
      <h1 style="margin:0;font-size:24px;font-weight:700;">${companyName}</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:14px;">AVG-compliance rapport</p>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 20px;color:#374151;line-height:1.6;">
        Wij analyseren Nederlandse websites op AVG-compliance. Hieronder vindt u het resultaat van de scan van uw website.
      </p>

      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;width:120px;height:120px;border-radius:50%;background:${color};color:#fff;line-height:120px;font-size:36px;font-weight:700;">
          ${avgScore}
        </div>
        <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">AVG-score (0–100)</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        ${row("SSL-certificaat aanwezig", hasSSL)}
        ${row("Cookiebanner aanwezig", hasCookieBanner)}
        ${row("Privacyverklaring aanwezig", hasPrivacyPage)}
        ${row("Toestemmingscheckbox in contactformulier", contactFormHasConsent)}
      </table>

      ${screenshotUrl ? `
      <div style="margin:24px 0;">
        <p style="margin:0 0 8px;font-weight:600;color:#374151;">Screenshot van uw website</p>
        <img src="${screenshotUrl}" alt="Screenshot" style="max-width:100%;height:auto;border-radius:8px;border:1px solid #e5e7eb;" />
      </div>
      ` : ""}

      <p style="margin:24px 0 12px;font-weight:600;color:#374151;">Neem contact op voor een offerte</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 8px 8px 0;">
            <a href="mailto:${encodeURIComponent(contactEmail)}?subject=Offerte%20eenmalige%20update%20-%20${encodeURIComponent(companyName)}" style="display:inline-block;padding:14px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Eenmalige update — 299 euro</a>
          </td>
          <td style="padding:8px 0 8px 8px;">
            <a href="mailto:${encodeURIComponent(contactEmail)}?subject=Offerte%20maandelijks%20pakket%20-%20${encodeURIComponent(companyName)}" style="display:inline-block;padding:14px 24px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Maandelijks pakket — 29 euro/maand</a>
          </td>
        </tr>
      </table>

      <p style="margin:28px 0 0;color:#6b7280;font-size:14px;line-height:1.6;">
        Met vriendelijke groet,<br>
        <strong>${contactName}</strong><br>
        ${contactEmail}
      </p>
    </div>
    <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        U ontvangt deze mail eenmalig. Reply met &quot;uitschrijven&quot; om geen berichten meer te ontvangen.
      </p>
    </div>
  </div>
</body>
</html>
`.trim();
}
