"use client";

import { useState } from "react";
import Link from "next/link";

interface ScanResultItem {
  url: string;
  success: boolean;
  score?: number;
  companyName?: string | null;
  error?: string;
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

export default function ImportPage() {
  const [urlsText, setUrlsText] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<ScanResultItem[]>([]);
  const [done, setDone] = useState(false);

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
            ← Terug naar dashboard
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
              ? `${uniqueUrls.length} geldige URL(s) gevonden`
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
                  key={`${item.url}-${i}`}
                  className="p-4 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-200 font-medium truncate">
                      {item.companyName ?? item.url}
                    </p>
                    <p className="text-slate-500 text-sm truncate">{item.url}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.success && item.score != null ? (
                      <span
                        className={`font-bold tabular-nums ${scoreColor(
                          item.score
                        )}`}
                      >
                        {item.score}
                      </span>
                    ) : (
                      <span className="text-red-400 text-sm">
                        {item.error ?? "Fout"}
                      </span>
                    )}
                    {item.success ? (
                      <span className="text-emerald-400 text-sm">✓</span>
                    ) : (
                      <span className="text-red-400 text-sm">✗</span>
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
