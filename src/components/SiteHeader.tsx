import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border/80 bg-surface/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-6 px-6 py-5">
        <Link href="/" className="group block">
          <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">
            Supply chain investigation
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-ink transition-colors group-hover:text-accent">
            TRACE
          </h1>
        </Link>
        <p className="hidden max-w-xs text-right text-sm leading-snug text-muted sm:block">
          When something goes wrong, find where it came from and everything it
          could affect.
        </p>
      </div>
    </header>
  );
}
