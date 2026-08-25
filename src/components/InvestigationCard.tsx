import Link from "next/link";
import { SeverityBadge } from "@/components/SeverityBadge";
import type { QualityEvent } from "@/lib/types";

export function InvestigationCard({
  event,
  featured = false,
}: {
  event: QualityEvent;
  featured?: boolean;
}) {
  return (
    <article
      className={`animate-fade-up border border-border bg-surface ${
        featured ? "p-7 shadow-[0_18px_40px_rgba(26,31,36,0.08)]" : "p-5"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={event.severity} />
        <span className="font-mono text-[11px] tracking-wide text-muted uppercase">
          {event.status}
        </span>
      </div>

      <h2
        className={`mt-3 font-[family-name:var(--font-display)] font-semibold text-ink ${
          featured ? "text-3xl" : "text-xl"
        }`}
      >
        {event.batchNumber}
      </h2>
      <p className="mt-1 text-base text-foreground/90">{event.type}</p>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        {event.description}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
        <p className="font-mono text-xs text-muted">
          {event.id} · reported {event.reportedAt}
        </p>
        <Link
          href={`/investigations/${event.id}`}
          className="inline-flex items-center bg-ink px-4 py-2 text-sm font-medium text-surface transition hover:bg-accent"
        >
          Investigate impact
        </Link>
      </div>
    </article>
  );
}
