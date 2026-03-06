"use client";

import { useEffect, useState } from "react";

type Status = "PENDING" | "SCANNED" | "EMAILED" | "CONVERTED";

interface ScannedSite {
  id: number;
  url: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  screenshotUrl: string | null;
  hasSSL: boolean;
  hasCookieBanner: boolean;
  hasPrivacyPage: boolean;
  hasContactForm: boolean;
  contactFormHasConsent: boolean;
  avgScore: number;
  status: Status;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

function scoreColor(score: number): string {
  if (score < 50) return "text-red-400";
  if (score <= 75) return "text-amber-400";
  return "text-emerald-400";
}

function scoreBgColor(score: number): string {
  if (score < 50) return "bg-red-500/20 text-red-400";
  if (score <= 75) return "bg-amber-500/20 text-amber-400";
  return "bg-emerald-500/20 text-emerald-400";
}

function statusBadgeClass(status: Status): string {
  switch (status) {
    case "PENDING":
      return "bg-slate-500/30 text-slate-300";
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

export default function DashboardPage() {
  const [sites, setSites] = useState<ScannedSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<ScannedSite | null>(null);
  const [scanUrl, setScanUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<number | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const loadSites = async () => {
    try {
      const res = await fetch("/api/scan");
      if (res.ok) {
        const data = await res.json();
        setSites(data);
      }
    } catch (e) {
      console.error("Load sites error:", e);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (selectedSite) setEditEmail(selectedSite.email ?? "");
  }, [selectedSite?.id]);

  const totalScanned = sites.length;
  const avgScore =
    sites.length > 0
      ? Math.round(
          sites.reduce((sum, s) => sum + s.avgScore, 0) / sites.length
        )
      : 0;
  const totalEmailed = sites.filter((s) => s.status === "EMAILED").length;
  const totalConverted = sites.filter((s) => s.status === "CONVERTED").length;

  const handleScan = async () => {
    const url = scanUrl.trim();
    if (!url) return;
    setScanning(true);
    setScanError(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setScanError(data.error ?? "Scan mislukt");
        return;
      }
      setSites((prev) => [data, ...prev]);
      setScanUrl("");
        setSelectedSite(data);
        setEditEmail(data.email ?? "");
    } catch {
      setScanError("Scan mislukt");
    } finally {
      setScanning(false);
    }
  };

  const handleSendEmail = async (siteId: number) => {
    setSendingEmail(siteId);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId }),
      });
      const data = await res.json();
      if (res.ok) {
        await loadSites();
        setSelectedSite((prev) =>
          prev?.id === siteId ? { ...prev, status: "EMAILED" } : prev
        );
      } else {
        alert(data.error ?? "E-mail verzenden mislukt");
      }
    } catch {
      alert("E-mail verzenden mislukt");
    } finally {
      setSendingEmail(null);
    }
  };

  const handleSaveEmail = async () => {
    if (!selectedSite) return;
    setSavingEmail(true);
    try {
      const res = await fetch("/api/scan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: selectedSite.id, email: editEmail }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSites((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );
        setSelectedSite(updated);
      }
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSetConverted = async (siteId: number) => {
    setUpdatingStatus(siteId);
    try {
      const res = await fetch("/api/scan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, status: "CONVERTED" }),
      });
      if (res.ok) {
        await loadSites();
        setSelectedSite((prev) =>
          prev?.id === siteId ? { ...prev, status: "CONVERTED" } : prev
        );
      } else {
        const data = await res.json();
        alert(data.error ?? "Update mislukt");
      }
    } catch {
      alert("Update mislukt");
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-50">
          MKB Scanner Dashboard
        </h1>

        {/* 1. Statistieken */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <p className="text-slate-400 text-sm font-medium">Totaal gescand</p>
            <p className="text-2xl font-bold text-slate-50 mt-1">{totalScanned}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <p className="text-slate-400 text-sm font-medium">
              Gemiddelde AVG score
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${scoreColor(avgScore)}`}
            >
              {avgScore}
            </p>
          </div>
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <p className="text-slate-400 text-sm font-medium">Aantal gemaild</p>
            <p className="text-2xl font-bold text-slate-50 mt-1">
              {totalEmailed}
            </p>
          </div>
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <p className="text-slate-400 text-sm font-medium">Geconverteerd</p>
            <p className="text-2xl font-bold text-slate-50 mt-1">
              {totalConverted}
            </p>
          </div>
        </section>

        {/* 2. Scan invoer */}
        <section className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h2 className="text-lg font-semibold text-slate-200 mb-3">
            Nieuwe scan
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              placeholder="https://voorbeeld.nl"
              value={scanUrl}
              onChange={(e) => setScanUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              className="flex-1 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 px-4 py-2.5 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={scanning}
            />
            <button
              onClick={handleScan}
              disabled={scanning}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px]"
            >
              {scanning ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Scannen…
                </>
              ) : (
                "Scan"
              )}
            </button>
          </div>
          {scanError && (
            <p className="mt-2 text-sm text-red-400">{scanError}</p>
          )}
        </section>

        {/* 3. Sites tabel */}
        <section className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <h2 className="text-lg font-semibold text-slate-200 p-5 pb-0">
            Gescande sites
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="p-3 text-slate-400 font-medium text-sm">
                    Bedrijfsnaam / URL
                  </th>
                  <th className="p-3 text-slate-400 font-medium text-sm">
                    AVG Score
                  </th>
                  <th className="p-3 text-slate-400 font-medium text-sm">SSL</th>
                  <th className="p-3 text-slate-400 font-medium text-sm">
                    Cookie
                  </th>
                  <th className="p-3 text-slate-400 font-medium text-sm">
                    Privacy
                  </th>
                  <th className="p-3 text-slate-400 font-medium text-sm">
                    Status
                  </th>
                  <th className="p-3 text-slate-400 font-medium text-sm">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr
                    key={site.id}
                    onClick={() => setSelectedSite(site)}
                    className={`border-b border-slate-700/80 hover:bg-slate-700/50 cursor-pointer transition-colors ${
                      selectedSite?.id === site.id ? "bg-slate-700/50" : ""
                    }`}
                  >
                    <td className="p-3">
                      <p className="font-medium text-slate-200 truncate max-w-[200px]">
                        {site.companyName || site.url}
                      </p>
                      <p className="text-slate-500 text-sm truncate max-w-[200px]">
                        {site.url}
                      </p>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold ${scoreBgColor(
                          site.avgScore
                        )}`}
                      >
                        {site.avgScore}
                      </span>
                    </td>
                    <td className="p-3">
                      {site.hasSSL ? (
                        <span className="text-emerald-400">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </td>
                    <td className="p-3">
                      {site.hasCookieBanner ? (
                        <span className="text-emerald-400">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </td>
                    <td className="p-3">
                      {site.hasPrivacyPage ? (
                        <span className="text-emerald-400">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${statusBadgeClass(
                          site.status
                        )}`}
                      >
                        {site.status}
                      </span>
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSendEmail(site.id)}
                          disabled={
                            !site.email ||
                            sendingEmail === site.id ||
                            site.status === "EMAILED"
                          }
                          className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sendingEmail === site.id ? "…" : "Mail"}
                        </button>
                        <button
                          onClick={() => handleSetConverted(site.id)}
                          disabled={
                            updatingStatus === site.id ||
                            site.status === "CONVERTED"
                          }
                          className="px-3 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingStatus === site.id ? "…" : "Geconverteerd"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sites.length === 0 && (
            <p className="p-6 text-slate-500 text-center">
              Nog geen sites. Voer een URL in en klik op Scan.
            </p>
          )}
        </section>

        {/* 4. Detail panel */}
        {selectedSite && (
          <section className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-slate-200">
                {selectedSite.companyName || selectedSite.url}
              </h2>
              <button
                onClick={() => setSelectedSite(null)}
                className="text-slate-400 hover:text-slate-200"
                aria-label="Sluiten"
              >
                ✕
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <p className="text-slate-400 text-sm">
                  Aangemaakt:{" "}
                  {new Date(selectedSite.createdAt).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                {selectedSite.phone && (
                  <p className="text-slate-300">
                    <span className="text-slate-500">Telefoon: </span>
                    {selectedSite.phone}
                  </p>
                )}
                {selectedSite.city && (
                  <p className="text-slate-300">
                    <span className="text-slate-500">Stad/gemeente: </span>
                    {selectedSite.city}
                  </p>
                )}
                <div>
                  <label className="block text-slate-400 text-sm mb-1">
                    E-mailadres
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="info@voorbeeld.nl"
                      className="flex-1 min-w-[200px] rounded-lg bg-slate-700 border border-slate-600 text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={handleSaveEmail}
                      disabled={savingEmail}
                      className="px-3 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm disabled:opacity-50"
                    >
                      {savingEmail ? "…" : "Opslaan"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-slate-400 text-sm">AVG-checklist</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    {selectedSite.hasSSL ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                    <span className="text-slate-300">
                      SSL-certificaat aanwezig
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {selectedSite.hasCookieBanner ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                    <span className="text-slate-300">Cookiebanner aanwezig</span>
                  </li>
                  <li className="flex items-center gap-2">
                    {selectedSite.hasPrivacyPage ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                    <span className="text-slate-300">
                      Privacyverklaring aanwezig
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {selectedSite.contactFormHasConsent ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                    <span className="text-slate-300">
                      Toestemmingscheckbox in contactformulier
                    </span>
                  </li>
                </ul>
                <div className="pt-2">
                  <span className="text-slate-400 text-sm">Score: </span>
                  <span
                    className={`font-bold ${scoreColor(
                      selectedSite.avgScore
                    )}`}
                  >
                    {selectedSite.avgScore}/100
                  </span>
                </div>
                <button
                  onClick={() => handleSendEmail(selectedSite.id)}
                  disabled={
                    !selectedSite.email ||
                    sendingEmail === selectedSite.id ||
                    selectedSite.status === "EMAILED"
                  }
                  className="mt-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingEmail === selectedSite.id
                    ? "Versturen…"
                    : "E-mail versturen"}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
