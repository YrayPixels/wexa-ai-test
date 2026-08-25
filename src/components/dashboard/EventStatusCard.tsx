import type { QualityEvent } from "@/lib/types";
import { SeverityBadge } from "@/components/SeverityBadge";

export function EventStatusCard({ event }: { event: QualityEvent }) {
  return (
    <section className="dashboard-card flex h-full flex-col p-5 animate-fade-up">
      <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
        Event status
      </p>
      <div className="mt-4 flex items-center gap-2">
        <SeverityBadge severity={event.severity} />
        <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-muted">
          {event.status}
        </span>
      </div>

      <div className="mt-6 flex flex-1 flex-col justify-center">
        <p className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-ink tabular-nums sm:text-5xl">
          {event.reportedAt}
        </p>
        <p className="mt-2 text-sm text-muted">Reported date</p>
      </div>

      <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Event ID</dt>
          <dd className="font-mono text-xs text-ink">{event.id}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Batch</dt>
          <dd className="font-medium text-ink">{event.batchNumber}</dd>
        </div>
      </dl>
    </section>
  );
}
