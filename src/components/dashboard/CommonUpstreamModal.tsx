"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { CommonUpstreamMatch, NodeLabel } from "@/lib/types";

export type CommonUpstreamChip = {
  id: string;
  label: string;
};

export function useCommonUpstreamSelection<T extends { id: string }>(
  rows: T[],
  options: {
    label: NodeLabel;
    noun: string;
    chip: (row: T) => string;
  },
) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const chips = selectedIds.map((id) => {
    const row = rows.find((item) => item.id === id);
    return {
      id,
      label: row ? options.chip(row) : id,
    };
  });

  const selectionProps = {
    selectable: true as const,
    selectedIds,
    onSelectedIdsChange: setSelectedIds,
    selectionActions: (
      <>
        <button
          type="button"
          disabled={selectedIds.length < 2}
          onClick={() => setModalOpen(true)}
          className="rounded-full bg-ink px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-accent disabled:opacity-40"
        >
          Find common upstream
        </button>
        <button
          type="button"
          onClick={() => setSelectedIds([])}
          className="text-xs font-medium text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Clear selection
        </button>
      </>
    ) as ReactNode,
  };

  const modal = (
    <CommonUpstreamModal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      label={options.label}
      noun={options.noun}
      entityIds={selectedIds}
      chips={chips}
    />
  );

  return { selectionProps, modal };
}

export function CommonUpstreamModal({
  open,
  onClose,
  label,
  noun,
  entityIds = [],
  chips = [],
}: {
  open: boolean;
  onClose: () => void;
  label: NodeLabel;
  noun: string;
  entityIds?: string[];
  chips?: CommonUpstreamChip[];
}) {
  const [mounted, setMounted] = useState(false);
  const [matches, setMatches] = useState<CommonUpstreamMatch[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idsKey = entityIds.join(",");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || entityIds.length < 2) return;

    let active = true;
    setLoading(true);
    setError(null);
    setMatches(null);

    const ids = idsKey.split(",").filter(Boolean);

    fetch("/api/trace/common", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, label }),
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to find common upstream");
        }
        if (active) setMatches(payload.matches as CommonUpstreamMatch[]);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setMatches(null);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to find common upstream nodes.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, idsKey, label, entityIds.length]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Close common upstream modal"
        className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Common upstream"
        className="relative z-[81] flex max-h-[min(88vh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-[20px] border border-border bg-surface shadow-[0_24px_80px_rgba(10,10,10,0.28)] animate-fade-up"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
              Shared dependency
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-ink">
              Common upstream
            </h2>
            <p className="mt-1 text-sm text-muted">
              Nodes shared by all {entityIds.length} selected {noun}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink transition hover:border-accent hover:text-accent"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="border-b border-border px-5 py-3">
          <p className="font-mono text-[10px] tracking-wider text-muted uppercase">
            Selected {noun}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip.id}
                className="rounded-full bg-accent-soft px-2.5 py-1 font-mono text-[10px] text-accent"
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="animate-pulse-soft font-mono text-sm text-muted">
              Searching shared upstream…
            </p>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-critical/25 bg-critical-soft/40 px-3 py-2 text-sm text-critical">
              {error}
            </p>
          ) : null}

          {matches ? (
            matches.length === 0 ? (
              <p className="text-sm text-muted">
                No shared upstream nodes across these {noun}.
                {label === "Supplier"
                  ? " Suppliers sit at the top of the supply chain."
                  : ""}
              </p>
            ) : (
              <ul className="space-y-3">
                {matches.map((match) => (
                  <li
                    key={match.id}
                    className="rounded-xl border border-border bg-white px-3 py-2.5"
                  >
                    <p className="text-sm font-semibold text-ink">{match.title}</p>
                    <p className="font-mono text-[10px] tracking-wide text-muted uppercase">
                      {match.label} · shared by {match.sharedBy}
                      {match.subtitle ? ` · ${match.subtitle}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
