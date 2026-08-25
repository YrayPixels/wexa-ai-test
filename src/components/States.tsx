export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="dashboard-card px-6 py-12 text-center">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-ink">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
        {body}
      </p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-[var(--card-radius)] border border-critical/25 bg-critical-soft/50 px-6 py-8">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-critical">
        Unable to connect to TRACE
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground/80">
        {message}
      </p>
      <p className="mt-2 text-sm text-muted">Your data has not been modified.</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-accent"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="dashboard-card px-6 py-12">
      <p className="animate-pulse-soft font-mono text-sm text-muted">{label}</p>
    </div>
  );
}
