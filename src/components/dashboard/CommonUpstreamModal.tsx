"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { CommonUpstreamMatch, ProductRow } from "@/lib/types";

export function CommonUpstreamModal({
  open,
  onClose,
  products,
  productIds,
}: {
  open: boolean;
  onClose: () => void;
  products: ProductRow[];
  productIds: string[];
}) {
  const [mounted, setMounted] = useState(false);
  const [matches, setMatches] = useState<CommonUpstreamMatch[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProducts = useMemo(
    () =>
      productIds
        .map((id) => products.find((product) => product.id === id))
        .filter((product): product is ProductRow => Boolean(product)),
    [products, productIds],
  );

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
    if (!open || productIds.length < 2) return;

    let active = true;
    setLoading(true);
    setError(null);
    setMatches(null);

    const ids = [...productIds];

    fetch("/api/trace/common", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: ids }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when selection identity changes
  }, [open, productIds.join(",")]);

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
              Nodes shared by all {productIds.length} selected products.
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
            Selected products
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedProducts.map((product) => (
              <span
                key={product.id}
                className="rounded-full bg-accent-soft px-2.5 py-1 font-mono text-[10px] text-accent"
              >
                {product.sku}
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
                No shared upstream nodes across these products.
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
