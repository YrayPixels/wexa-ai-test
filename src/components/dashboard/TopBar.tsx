"use client";

import type { DashboardSection } from "@/lib/types";

const sectionLabels: Record<DashboardSection, string> = {
  events: "Events",
  batches: "Batches",
  products: "Products",
  shipments: "Shipments",
  customers: "Customers",
};

export function DashboardTopBar({
  section,
  crumb,
  status,
  actionLabel,
  onAction,
  onMenuClick,
}: {
  section: DashboardSection;
  crumb?: string | null;
  status?: string | null;
  actionLabel?: string | null;
  onAction?: () => void;
  onMenuClick: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-ink md:hidden"
          aria-label="Open menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path
              d="M3 5h12M3 9h12M3 13h12"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <nav className="min-w-0 text-sm text-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>TRACE</li>
            <li aria-hidden className="text-border">
              ›
            </li>
            <li className="font-medium text-ink">{sectionLabels[section]}</li>
            {crumb ? (
              <>
                <li aria-hidden className="text-border">
                  ›
                </li>
                <li className="truncate font-mono text-xs text-accent">{crumb}</li>
              </>
            ) : null}
          </ol>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {status ? (
          <span className="hidden rounded-full bg-surface-muted px-3 py-1.5 font-mono text-[11px] text-muted sm:inline">
            {status}
          </span>
        ) : null}
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </header>
  );
}
