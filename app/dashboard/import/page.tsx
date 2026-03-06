"use client";

import { useState } from "react";
import Link from "next/link";

type ResultStatus = "SCANNED" | "EMAILED" | "CONVERTED";

interface ScanResultItem {
  url: string;
  success: boolean;
  score?: number;
  companyName?: string | null;
  error?: string;
  siteId?: number;
  email?: string | null;
  status?: ResultStatus;
}

function isValidUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function scoreColor(score: number): string {
  if (score < 50) return "text-red-400";
  if (score <= 75) return "text-amber-400";
  return "text-emerald-400";
}

function statusBadgeClass(status: ResultStatus): string {
  switch (status) {
    case "SCANNED":
      return "bg-blue-500/30 text-blue-300";
    case "EMAILED":
      return "bg-violet-500/30 text-violet-300";
    case "CONVERTED":
      return "bg-emerald-500/30 text-emerald-300";
    default:
      return "bg-slate-500/30 text-slate-300";
  }
}

export default function ImportPage() {
  const [urlsText, setUrlsText] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<ScanResultItem[]>([]);
  const [done, setDone] = useState(false);
  const [sendingMailId, setSendingMailId] = useState<number | null>(null);

  const validUrls = urlsText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => isValidUrl(line));

  const uniqueUrls = Array.from(new Set(validUrls));

  const handleImport = async () => {
    if (uniqueUrls.length === 0) return;
    setImporting(true);
    setDone(false);
    setResults([]);
    setProgress({ current: 0, total: uniqueUrls.length });

    const collected: ScanResultItem[] = [];

    for (let i = 0; i < uniqueUrls.length; i++) {
      const url = uniqueUrls[i];
      setProgress({ current: i + 1, total: uniqueUrls.length });

      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();

        if (res.ok) {
          collected.push({
            url,
            success: true,
            score: data.avgScore,
            companyName: data.companyName,
            siteId: data.id,
            email: data.email ?? null,
            status: (data.status === "EMAILED" || data.status === "CONVERTED" ? data.status : "SCANNED") as ResultStatus,
          });
        } else {
          collected.push({
            url,
            success: false,
            error: data.error ?? "Scan mislukt",
          });
        }
      } catch {
        collected.push({
          url,
          success: false,
          error: "Netwerkfout",
        });
      }

      setResults([...collected]);
    }

    setDone(true);
    setImporting(false);
  };

  const handleSendMail = async (siteId: number) => {
    setSendingMailId(siteId);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId }),
      });
      if (res.ok) {
        setResults((prev) =>
          prev.map((r) => (r.siteId === siteId ? { ...r, status: "EMAILED" as ResultStatus } : r))
        );
      } else {
        const data = await res.json();
        alert(data.error ?? "E-mail verzenden mislukt");
      }
    } catch {
      alert("E-mail verzenden mislukt");
    } finally {
      setSendingMailId(null);
    }
  };

  const successCount = results.filter((r) => r.success).length;
  const scores = results.filter((r) => r.success && r.score != null).map((r) => r.score!);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            ← Naar dashboard
          </Link>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-slate-50">
          Importeer en scan URLs
        </h1>

        <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <label className="block text-slate-300 font-medium mb-2">
            URLs (één per regel, http(s)://)
          </label>
          <textarea
            value={urlsText}
            onChange={(e) => setUrlsText(e.target.value)}
            placeholder={"https://example.com\nhttps://example.org/contact"}
            rows={12}
            className="w-full rounded-lg bg-slate-700 border border-slate-600 text-slate-100 px-4 py-3 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm resize-y min-h-[200px]"
            disabled={importing}
          />
          <p className="mt-2 text-slate-500 text-sm">
            {uniqueUrls.length > 0
              ? `${uniqueUrls.length} geldige URLs gevonden`
              : "Plak URLs, één per regel (http:// of https://)."}
          </p>
        </section>

        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <button
            onClick={handleImport}
            disabled={importing || uniqueUrls.length === 0}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {importing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Bezig…
              </>
            ) : (
              "Importeer en scan alles"
            )}
          </button>
        </div>

        {importing && (
          <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <p className="text-slate-300 font-medium mb-2">
              {progress.current} van {progress.total} gescand
            </p>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{
                  width: `${progress.total ? (100 * progress.current) / progress.total : 0}%`,
                }}
              />
            </div>
          </section>
        )}

        {results.length > 0 && (
          <section className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <h2 className="text-lg font-semibold text-slate-200 p-5 pb-2">
              Resultaten {importing ? "(live)" : ""}
            </h2>
            <ul className="divide-y divide-slate-700 max-h-[400px] overflow-y-auto">
              {results.map((item, i) => (
                <li
                  key={`${item.url}-${i}-${item.siteId ?? ""}`}
                  className="p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-200 font-medium truncate">
                      {item.companyName ?? item.url}
                    </p>
                    <p className="text-slate-500 text-sm truncate">{item.url}</p>
                    {item.success && item.email && (
                      <p className="text-slate-400 text-xs mt-0.5 truncate">
                        {item.email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.success && item.status && (
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    )}
                    {item.success && item.score != null && (
                      <span
                        className={`font-bold tabular-nums ${scoreColor(
                          item.score
                        )}`}
                      >
                        {item.score}
                      </span>
                    )}
                    {!item.success && (
                      <span className="text-red-400 text-sm">
                        {item.error ?? "Fout"}
                      </span>
                    )}
                    {item.success && item.siteId && (
                      <button
                        onClick={() => handleSendMail(item.siteId!)}
                        disabled={
                          !item.email ||
                          sendingMailId === item.siteId ||
                          item.status === "EMAILED" ||
                          item.status === "CONVERTED"
                        }
                        className="px-2 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingMailId === item.siteId ? "…" : "Mail versturen"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {done && results.length > 0 && (
          <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h2 className="text-lg font-semibold text-slate-200 mb-3">
              Samenvatting
            </h2>
            <p className="text-slate-300">
              <strong>{successCount}</strong> van {results.length} URL(s)
              succesvol gescand.
            </p>
            {successCount > 0 && (
              <p className="text-slate-300 mt-1">
                Gemiddelde AVG-score:{" "}
                <span className={scoreColor(avgScore)}>{avgScore}</span>
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
