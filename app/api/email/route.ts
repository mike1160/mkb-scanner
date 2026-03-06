import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEmailHTML } from "@/lib/emailTemplate";
import { Status } from "@prisma/client";

const BREVO_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const siteId = typeof body?.siteId === "number" ? body.siteId : null;

    if (siteId == null) {
      return NextResponse.json(
        { error: "siteId (number) is verplicht" },
        { status: 400 }
      );
    }

    const site = await prisma.scannedSite.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Site niet gevonden" },
        { status: 404 }
      );
    }

    const email = site.email?.trim();
    if (!email) {
      return NextResponse.json(
        { error: "Geen e-mailadres gekoppeld aan deze site" },
        { status: 400 }
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) {
      return NextResponse.json(
        { error: "E-mail niet geconfigureerd (BREVO_API_KEY / EMAIL_FROM)" },
        { status: 500 }
      );
    }

    const html = generateEmailHTML({
      companyName: site.companyName ?? site.url,
      url: site.url,
      avgScore: site.avgScore,
      hasSSL: site.hasSSL,
      hasCookieBanner: site.hasCookieBanner,
      hasPrivacyPage: site.hasPrivacyPage,
      contactFormHasConsent: site.contactFormHasConsent,
      screenshotUrl: site.screenshotUrl,
      contactEmail: from,
    });

    const res = await fetch(BREVO_EMAIL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { email: from },
        to: [{ email }],
        subject: `AVG-scan resultaat: ${site.companyName ?? site.url}`,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Brevo error:", res.status, errBody);
      return NextResponse.json(
        { error: "E-mail verzenden mislukt", details: errBody },
        { status: 502 }
      );
    }

    await prisma.scannedSite.update({
      where: { id: siteId },
      data: { status: Status.EMAILED },
    });

    return NextResponse.json({
      success: true,
      message: "E-mail verzonden",
      status: Status.EMAILED,
    });
  } catch (err) {
    console.error("POST /api/email error:", err);
    return NextResponse.json(
      { error: "E-mail verzenden mislukt" },
      { status: 500 }
    );
  }
}
