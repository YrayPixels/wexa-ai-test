"use client";

import type { EntityDetail, TraceStep } from "@/lib/types";

export function NodeDetailsPanel({
  entity,
  upstream,
  upstreamError,
  loadingUpstream,
  onTraceUpstream,
}: {
  entity: EntityDetail | null;
  upstream: TraceStep[] | null;
  upstreamError?: string | null;
  loadingUpstream: boolean;
  onTraceUpstream: () => void;
}) {
  if (!entity) {
    return (
      <aside className="dashboard-card flex h-full flex-col p-5">
        <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
          Entity detail
        </p>
        <div className="mt-6 flex flex-1 flex-col items-start justify-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 6v3.5M9 12h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Select a node in the supply-chain graph to inspect properties and
            trace upstream.
          </p>
        </div>
      </aside>
    );
  }

  const entries = Object.entries(entity.properties).filter(
    ([key]) => key !== "id",
  );

  return (
    <aside className="dashboard-card flex h-full flex-col p-5 animate-fade-up">
      <p className="font-mono text-[10px] tracking-[0.16em] text-accent uppercase">
        {entity.label}
      </p>
      <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
        {entity.title}
      </h3>
      <p className="mt-1 font-mono text-xs text-muted">{entity.id}</p>

      <dl className="mt-5 max-h-40 space-y-3 overflow-y-auto border-t border-border pt-4">
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
          className="mt-5 w-full rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-60"
        >
          {loadingUpstream ? "Tracing upstream…" : "Trace upstream"}
        </button>
      ) : null}

      {upstreamError ? (
        <p className="mt-4 rounded-xl border border-critical/25 bg-critical-soft/40 px-3 py-2 text-sm text-critical">
          {upstreamError}
        </p>
      ) : null}

      {upstream && upstream.length > 0 ? (
        <div className="mt-5 border-t border-border pt-4">
          <p className="font-mono text-[10px] tracking-wider text-muted uppercase">
            Upstream path
          </p>
          <ol className="mt-3 space-y-3">
            {upstream.map((step, index) => (
              <li key={step.id} className="flex items-start gap-3 text-sm">
                <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-accent" />
                <div className="min-w-0">
                  <p className="font-medium text-ink">{step.title}</p>
                  <p className="text-xs text-muted">
                    {String(index + 1).padStart(2, "0")} · {step.label}
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
