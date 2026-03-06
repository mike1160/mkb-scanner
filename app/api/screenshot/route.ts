import { NextRequest, NextResponse } from "next/server";

const SCREENSHOT_API_BASE = "https://shot.screenshotapi.net/screenshot";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = typeof body?.url === "string" ? body.url.trim() : null;

    if (!url) {
      return NextResponse.json({ screenshotUrl: null });
    }

    const token = process.env.SCREENSHOT_API_KEY;
    if (!token) {
      return NextResponse.json({ screenshotUrl: null });
    }

    const params = new URLSearchParams({
      token,
      url,
      output: "image",
      file_type: "png",
      wait_for_event: "load",
      width: "1280",
      height: "800",
    });

    const apiUrl = `${SCREENSHOT_API_BASE}?${params.toString()}`;
    const res = await fetch(apiUrl, { redirect: "follow" });

    if (!res.ok) {
      return NextResponse.json({ screenshotUrl: null });
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.startsWith("image/")) {
      const finalUrl = res.url && !res.url.includes("token=") ? res.url : null;
      return NextResponse.json({ screenshotUrl: finalUrl });
    }

    const text = await res.text();
    let screenshotUrl: string | null = null;
    try {
      const data = JSON.parse(text) as Record<string, unknown>;
      if (typeof data.screenshotUrl === "string") screenshotUrl = data.screenshotUrl;
      else if (typeof data.screenshot_url === "string") screenshotUrl = data.screenshot_url;
      else if (typeof data.url === "string") screenshotUrl = data.url;
    } catch {
      // not JSON or no URL field
    }

    return NextResponse.json({ screenshotUrl });
  } catch {
    return NextResponse.json({ screenshotUrl: null });
  }
}
