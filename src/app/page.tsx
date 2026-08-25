import { SiteHeader } from "@/components/SiteHeader";
import { InvestigationCard } from "@/components/InvestigationCard";
import { EmptyState, ErrorState } from "@/components/States";
import { listInvestigations } from "@/lib/investigations";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let investigations = null;
  let errorMessage: string | null = null;

  try {
    investigations = await listInvestigations();
  } catch (error) {
    console.error("[TRACE] listInvestigations failed:", error);
    if (error instanceof Error && error.message.includes("Missing COGNODB")) {
      errorMessage =
        "Database credentials are not configured. Copy .env.example to .env.local, add your CognoDB Bolt URI and password, then run npm run seed.";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage =
        "The graph database is currently unavailable. Check your CognoDB connection and try again.";
    }
  }

  const featured =
    investigations?.find((e) => e.id === "QE-001") ?? investigations?.[0];
  const rest =
    investigations?.filter((e) => e.id !== featured?.id) ?? [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <section className="animate-fade-up">
          <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
            Active investigations
          </p>
          <h2 className="mt-2 max-w-2xl font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Product recall & supply chain impact
          </h2>
        </section>

        <section className="mt-8 space-y-4">
          {errorMessage ? <ErrorState message={errorMessage} /> : null}

          {!errorMessage && investigations && investigations.length === 0 ? (
            <EmptyState
              title="No quality events yet"
              body="Seed the graph with npm run seed to load the RM-2047 contamination scenario."
            />
          ) : null}

          {featured ? <InvestigationCard event={featured} featured /> : null}

          {rest.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {rest.map((event) => (
                <InvestigationCard key={event.id} event={event} />
              ))}
            </div>
          ) : null}
        </section>

        {investigations && investigations.length > 0 ? (
          <section className="mt-10 overflow-hidden border border-border bg-surface">
            <div className="border-b border-border px-5 py-3">
              <h3 className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
                Recent investigations
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-muted/50 font-mono text-[11px] tracking-wide text-muted uppercase">
                  <tr>
                    <th className="px-5 py-3 font-medium">ID</th>
                    <th className="px-5 py-3 font-medium">Batch</th>
                    <th className="px-5 py-3 font-medium">Severity</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {investigations.map((event) => (
                    <tr key={event.id} className="border-t border-border/70">
                      <td className="px-5 py-3 font-mono text-xs">{event.id}</td>
                      <td className="px-5 py-3 font-medium">{event.batchNumber}</td>
                      <td className="px-5 py-3">{event.severity}</td>
                      <td className="px-5 py-3 text-muted">{event.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
