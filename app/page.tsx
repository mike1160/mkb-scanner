import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-20 md:py-32">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-50 tracking-tight">
            MKB Website Scanner
          </h1>
          <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto">
            Analyseer Nederlandse websites op AVG-compliance
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-4">
              A
            </div>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">
              AVG Scan
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Controleer automatisch op SSL, cookiebanner, privacyverklaring
              en toestemmingscheckbox.
            </p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold mb-4">
              E
            </div>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">
              E-mail Rapport
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Stuur een professioneel AVG-rapport per e-mail naar
              potentiële klanten.
            </p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="w-10 h-10 rounded-lg bg-slate-500/30 text-slate-300 flex items-center justify-center font-bold mb-4">
              C
            </div>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">
              Conversie Tracking
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Houd bij welke sites gescand, gemaild en geconverteerd zijn.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
          >
            Ga naar Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
