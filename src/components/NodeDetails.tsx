"use client";

import type { EntityDetail, TraceStep } from "@/lib/types";

export function NodeDetailsPanel({
  entity,
  upstream,
  loadingUpstream,
  onTraceUpstream,
}: {
  entity: EntityDetail | null;
  upstream: TraceStep[] | null;
  loadingUpstream: boolean;
  onTraceUpstream: () => void;
}) {
  if (!entity) {
    return (
      <aside className="border border-border bg-surface p-5">
        <p className="font-mono text-[11px] tracking-wider text-muted uppercase">
          Entity detail
        </p>
        <p className="mt-3 text-sm text-muted">
          Select a node in the graph to inspect its properties.
        </p>
      </aside>
    );
  }

  const entries = Object.entries(entity.properties).filter(
    ([key]) => key !== "id",
  );

  return (
    <aside className="border border-border bg-surface p-5">
      <p className="font-mono text-[11px] tracking-wider text-accent uppercase">
        {entity.label}
      </p>
      <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
        {entity.title}
      </h3>
      <p className="mt-1 font-mono text-xs text-muted">{entity.id}</p>

      <dl className="mt-5 space-y-3 border-t border-border/80 pt-4">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className="font-mono text-[10px] tracking-wider text-muted uppercase">
              {key}
            </dt>
            <dd className="text-sm text-foreground">{String(value)}</dd>
          </div>
        ))}
      </dl>

      {entity.label === "Product" ? (
        <button
          type="button"
          onClick={onTraceUpstream}
          disabled={loadingUpstream}
          className="mt-5 w-full bg-ink px-4 py-2.5 text-sm font-medium text-surface transition hover:bg-accent disabled:opacity-60"
        >
          {loadingUpstream ? "Tracing upstream…" : "Trace upstream"}
        </button>
      ) : null}

      {upstream && upstream.length > 0 ? (
        <div className="mt-5 border-t border-border/80 pt-4">
          <p className="font-mono text-[10px] tracking-wider text-muted uppercase">
            Upstream path
          </p>
          <ol className="mt-3 space-y-2">
            {upstream.map((step, index) => (
              <li key={step.id} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 font-mono text-[10px] text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-medium text-ink">{step.title}</p>
                  <p className="text-xs text-muted">
                    {step.label}
                    {step.subtitle ? ` · ${step.subtitle}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </aside>
  );
}
