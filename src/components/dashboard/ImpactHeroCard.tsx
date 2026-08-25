import type { ImpactSummary, QualityEvent } from "@/lib/types";

export function ImpactHeroCard({
  event,
  impact,
}: {
  event: QualityEvent;
  impact: ImpactSummary;
}) {
  const totalTouched =
    impact.productionBatches +
    impact.products +
    impact.shipments +
    impact.orders +
    impact.customers;

  const stages = [
    { key: "productionBatches", label: "Production", value: impact.productionBatches },
    { key: "products", label: "Products", value: impact.products },
    { key: "shipments", label: "Shipments", value: impact.shipments },
    { key: "orders", label: "Orders", value: impact.orders },
    { key: "customers", label: "Customers", value: impact.customers },
  ] as const;

  return (
    <section className="dashboard-card-accent relative overflow-hidden p-6 animate-fade-up">
      <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 left-1/3 h-36 w-36 rounded-full bg-black/10 blur-2xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-white/80 uppercase">
            Blast radius · {event.type}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
            {event.batchNumber}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/85">
            {event.description}
          </p>
        </div>
        <div className="rounded-2xl bg-black/15 px-4 py-3 text-right backdrop-blur-sm">
          <p className="font-mono text-[10px] tracking-wider text-white/70 uppercase">
            Nodes touched
          </p>
          <p className="font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums">
            {totalTouched}
          </p>
        </div>
      </div>

      <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stages.map((stage, index) => (
          <div
            key={stage.key}
            className="rounded-2xl bg-white/15 px-3 py-3 backdrop-blur-[2px]"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums">
              {stage.value}
            </p>
            <p className="mt-0.5 text-[11px] tracking-wide text-white/75 uppercase">
              {stage.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
