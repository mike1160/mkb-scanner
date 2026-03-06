import * as cheerio from "cheerio";

const FETCH_TIMEOUT_MS = 10_000;

const COOKIE_KEYWORDS = ["cookie", "accepteren", "cookiebeleid"];
const PRIVACY_KEYWORDS = ["privacy", "privacyverklaring"];
const CONSENT_KEYWORDS = ["privacy", "akkoord", "consent", "toestemming", "accepteer"];

export interface ScanResult {
  hasSSL: boolean;
  hasCookieBanner: boolean;
  hasPrivacyPage: boolean;
  hasContactForm: boolean;
  contactFormHasConsent: boolean;
  avgScore: number;
  companyName: string | null;
}

const emptyResult = (): ScanResult => ({
  hasSSL: false,
  hasCookieBanner: false,
  hasPrivacyPage: false,
  hasContactForm: false,
  contactFormHasConsent: false,
  avgScore: 0,
  companyName: null,
});

function hasCookieOrConsentInSelector($: cheerio.CheerioAPI): boolean {
  const all = $("[id], [class]");
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const id = (el.attribs?.id ?? "").toLowerCase();
    const cls = (el.attribs?.class ?? "").toLowerCase();
    const combined = `${id} ${cls}`;
    if (combined.includes("cookie") || combined.includes("consent")) {
      return true;
    }
  }
  return false;
}

function pageTextContainsKeyword($: cheerio.CheerioAPI, keywords: string[]): boolean {
  const text = $("body").text().toLowerCase();
  return keywords.some((kw) => text.includes(kw.toLowerCase()));
}

function hasPrivacyLink($: cheerio.CheerioAPI): boolean {
  const links = $('a[href]');
  for (let i = 0; i < links.length; i++) {
    const text = $(links[i]).text().toLowerCase().trim();
    const href = (links[i].attribs?.href ?? "").toLowerCase();
    if (PRIVACY_KEYWORDS.some((kw) => text.includes(kw) || href.includes(kw))) {
      return true;
    }
  }
  return false;
}

function formHasConsentCheckbox($: cheerio.CheerioAPI): boolean {
  const forms = $("form");
  for (let f = 0; f < forms.length; f++) {
    const form = $(forms[f]);
    const checkboxes = form.find('input[type="checkbox"]');
    for (let c = 0; c < checkboxes.length; c++) {
      const cb = checkboxes[c];
      const id = cb.attribs?.id ?? "";
      const name = (cb.attribs?.name ?? "").toLowerCase();
      const label = form.find(`label[for="${id}"]`).text().toLowerCase();
      const parent = $(cb).parent().text().toLowerCase();
      const combined = `${label} ${parent} ${name}`;
      if (CONSENT_KEYWORDS.some((kw) => combined.includes(kw))) {
        return true;
      }
    }
  }
  return false;
}

export function extractCompanyInfo(html: string): string | null {
  try {
    const $ = cheerio.load(html);
    const title = $("title").first().text().trim();
    if (title) return title;

    const ogSiteName = $('meta[property="og:site_name"]').attr("content")?.trim();
    if (ogSiteName) return ogSiteName;

    const h1 = $("h1").first().text().trim();
    if (h1) return h1;

    return null;
  } catch {
    return null;
  }
}

function calculateScore(result: Omit<ScanResult, "companyName">): number {
  let score = 0;
  if (result.hasSSL) score += 25;
  if (result.hasCookieBanner) score += 25;
  if (result.hasPrivacyPage) score += 25;
  if (result.contactFormHasConsent) score += 25;
  return score;
}

export async function scanWebsite(url: string): Promise<ScanResult> {
  const trimmed = url.trim();
  if (!trimmed) return emptyResult();

  const hasSSL = trimmed.toLowerCase().startsWith("https://");

  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(trimmed, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MKB-Scanner/1.0)",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return { ...emptyResult(), hasSSL };

    html = await res.text();
  } catch {
    return { ...emptyResult(), hasSSL };
  }

  try {
    const $ = cheerio.load(html);

    const hasCookieBanner =
      pageTextContainsKeyword($, COOKIE_KEYWORDS) || hasCookieOrConsentInSelector($);

    const hasPrivacyPage = hasPrivacyLink($);
    const hasContactForm = $("form").length > 0;
    const contactFormHasConsent = hasContactForm && formHasConsentCheckbox($);

    const result: ScanResult = {
      hasSSL,
      hasCookieBanner,
      hasPrivacyPage,
      hasContactForm,
      contactFormHasConsent,
      avgScore: 0,
      companyName: extractCompanyInfo(html),
    };

    result.avgScore = calculateScore(result);
    return result;
  } catch {
    return {
      hasSSL,
      hasCookieBanner: false,
      hasPrivacyPage: false,
      hasContactForm: false,
      contactFormHasConsent: false,
      avgScore: 0,
      companyName: extractCompanyInfo(html),
    };
  }
}
