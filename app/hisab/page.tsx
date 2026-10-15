import type { Metadata } from "next";
import { loadVisitReport, type VisitCount } from "@/lib/siteVisits";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Website visits",
  robots: { index: false, follow: false },
};

function CountCard({
  label,
  hint,
  count,
}: {
  label: string;
  hint: string;
  count: VisitCount;
}) {
  return (
    <section className="rounded-3xl border border-gold-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">{label}</p>
      <p className="mt-1 text-sm text-maroon-700/70">{hint}</p>
      <p className="mt-4 font-display text-4xl font-bold text-maroon-900">{count.visitors.toLocaleString("en-PK")}</p>
      <p className="mt-1 text-sm font-semibold text-maroon-800">Log</p>
      <p className="mt-3 text-sm text-maroon-700/80">
        Pages khuli: <span className="font-semibold text-maroon-900">{count.pageviews.toLocaleString("en-PK")}</span>
      </p>
    </section>
  );
}

export default async function HisabPage() {
  let report: Awaited<ReturnType<typeof loadVisitReport>> | null = null;
  let failed = false;
  try {
    report = await loadVisitReport();
  } catch {
    failed = true;
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-700">jallundharmain.com</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-maroon-900">Website visits</h1>

      {failed || !report ? (
        <p className="mt-6 rounded-3xl border border-gold-200 bg-white p-5 text-sm text-maroon-800">
          Abhi visits ka hisaab nahi khul saka. Thori der baad page dubara kholen.
        </p>
      ) : (
        <>
          <div className="mt-6 grid gap-4">
            <CountCard label="Aaj" hint="Aaj raat 12 baje se" count={report.today} />
            <CountCard label="Is hafte" hint="Somwar se aaj tak" count={report.week} />
            <CountCard label="Is mahine" hint="Is mahine ki 1 tarikh se" count={report.month} />
          </div>

          {report.topPages.length > 0 ? (
            <section className="mt-4 rounded-3xl border border-gold-200 bg-white p-5 shadow-sm">
              <h2 className="font-display text-lg font-bold text-maroon-900">Is mahine zyada khule safhe</h2>
              <ol className="mt-3 grid gap-3">
                {report.topPages.map((page) => (
                  <li key={page.path} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 break-all text-maroon-800">{page.path}</span>
                    <span className="shrink-0 font-semibold text-maroon-900">{page.visitors.toLocaleString("en-PK")} log</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <p className="mt-4 text-xs leading-relaxed text-maroon-700/60">
            Updated {report.updatedAt}. 14 October 2026 se pehle ki visits is hisaab mein nahi hain.
          </p>
        </>
      )}
    </main>
  );
}
