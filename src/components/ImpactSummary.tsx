import type { ImpactSummary } from "@/lib/types";

const labels: Array<{ key: keyof ImpactSummary; label: string }> = [
  { key: "productionBatches", label: "Production batches" },
  { key: "products", label: "Products" },
  { key: "shipments", label: "Shipments" },
  { key: "orders", label: "Orders" },
  { key: "customers", label: "Customers" },
];

export function ImpactSummaryBar({ impact }: { impact: ImpactSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {labels.map((item, index) => (
        <div
          key={item.key}
          className="animate-fade-up border border-border bg-surface px-4 py-4"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tabular-nums text-ink">
            {impact[item.key]}
          </p>
          <p className="mt-1 text-xs tracking-wide text-muted uppercase">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
