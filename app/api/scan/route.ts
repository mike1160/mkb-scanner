import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scanWebsite } from "@/lib/scanner";
import { Status } from "@prisma/client";

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    const where =
      statusParam && Object.values(Status).includes(statusParam as Status)
        ? { status: statusParam as Status }
        : undefined;

    const sites = await prisma.scannedSite.findMany({
      where,
      orderBy: { avgScore: "asc" },
    });

    return NextResponse.json(sites);
  } catch (error) {
    console.error("GET /api/scan error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = typeof body?.url === "string" ? body.url.trim() : "";

    if (!url) {
      return NextResponse.json(
        { error: "url is verplicht" },
        { status: 400 }
      );
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: "Ongeldige URL" },
        { status: 400 }
      );
    }

    const existing = await prisma.scannedSite.findUnique({
      where: { url },
    });
    if (existing) {
      return NextResponse.json(existing);
    }

    const scanResult = await scanWebsite(url);

    let screenshotUrl: string | null = null;
    try {
      const origin = new URL(request.url).origin;
      const res = await fetch(`${origin}/api/screenshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as { screenshotUrl?: string | null };
      if (typeof data.screenshotUrl === "string") screenshotUrl = data.screenshotUrl;
    } catch {
      // screenshot optional, continue
    }

    const site = await prisma.scannedSite.create({
      data: {
        url,
        companyName: scanResult.companyName ?? undefined,
        email: scanResult.email ?? undefined,
        phone: scanResult.phone ?? undefined,
        city: scanResult.city ?? undefined,
        screenshotUrl: screenshotUrl ?? undefined,
        hasSSL: scanResult.hasSSL,
        hasCookieBanner: scanResult.hasCookieBanner,
        hasPrivacyPage: scanResult.hasPrivacyPage,
        hasContactForm: scanResult.hasContactForm,
        contactFormHasConsent: scanResult.contactFormHasConsent,
        avgScore: scanResult.avgScore,
        status: Status.SCANNED,
      },
    });

    return NextResponse.json(site);
  } catch (error) {
    console.error("POST /api/scan error:", error);
    return NextResponse.json(
      { error: "Scan mislukt" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const siteId = typeof body?.siteId === "number" ? body.siteId : null;
    const status = body?.status;
    const email = typeof body?.email === "string" ? body.email.trim() : undefined;

    if (siteId == null) {
      return NextResponse.json(
        { error: "siteId is verplicht" },
        { status: 400 }
      );
    }

    const data: { status?: Status; email?: string | null } = {};
    if (status !== undefined && Object.values(Status).includes(status as Status)) {
      data.status = status as Status;
    }
    if (email !== undefined) {
      data.email = email || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Geef status en/of email op" },
        { status: 400 }
      );
    }

    const site = await prisma.scannedSite.update({
      where: { id: siteId },
      data,
    });

    return NextResponse.json(site);
  } catch (error) {
    console.error("PATCH /api/scan error:", error);
    return NextResponse.json(
      { error: "Update mislukt" },
      { status: 500 }
    );
  }
}
