"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ImpactSummaryBar } from "@/components/ImpactSummary";
import { NodeDetailsPanel } from "@/components/NodeDetails";
import { SeverityBadge } from "@/components/SeverityBadge";
import { SiteHeader } from "@/components/SiteHeader";
import { ErrorState, LoadingState } from "@/components/States";
import { SupplyChainGraphView } from "@/components/SupplyChainGraph";
import type {
  EntityDetail,
  InvestigationDetail,
  TraceStep,
} from "@/lib/types";

export function InvestigationView({ eventId }: { eventId: string }) {
  const [data, setData] = useState<InvestigationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [entity, setEntity] = useState<EntityDetail | null>(null);
  const [upstream, setUpstream] = useState<TraceStep[] | null>(null);
  const [loadingUpstream, setLoadingUpstream] = useState(false);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/investigations/${id}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load investigation");
      }
      setData(payload as InvestigationDetail);
    } catch (err) {
      setData(null);
      setError(
        err instanceof Error
          ? err.message
          : "The graph database is currently unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(eventId);
  }, [eventId, load]);

  useEffect(() => {
    if (!selectedId) {
      setEntity(null);
      setUpstream(null);
      return;
    }

    let active = true;
    setUpstream(null);
    fetch(`/api/entities/${selectedId}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        if (active) setEntity(payload as EntityDetail);
      })
      .catch(() => {
        if (active) setEntity(null);
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  const onTraceUpstream = async () => {
    if (!entity || entity.label !== "Product") return;
    setLoadingUpstream(true);
    try {
      const response = await fetch(
        `/api/trace?productId=${encodeURIComponent(entity.id)}`,
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setUpstream(payload.steps as TraceStep[]);
    } catch {
      setUpstream([]);
    } finally {
      setLoadingUpstream(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <Link
          href="/"
          className="font-mono text-xs tracking-wide text-muted uppercase transition hover:text-accent"
        >
          ← Back to investigations
        </Link>

        {loading ? (
          <div className="mt-6">
            <LoadingState label="Tracing impact…" />
          </div>
        ) : null}

        {error ? (
          <div className="mt-6">
            <ErrorState
              message={error}
              onRetry={() => void load(eventId)}
            />
          </div>
        ) : null}

        {data ? (
          <div className="mt-6 space-y-8">
            <section className="animate-fade-up">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={data.event.severity} />
                <span className="font-mono text-[11px] tracking-wide text-muted uppercase">
                  {data.event.status}
                </span>
              </div>
              <p className="mt-3 font-mono text-xs tracking-[0.18em] text-muted uppercase">
                {data.event.type}
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-ink">
                {data.event.batchNumber}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                {data.event.description}
              </p>
            </section>

            <section>
              <h3 className="mb-3 font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
                Impact
              </h3>
              <ImpactSummaryBar impact={data.impact} />
            </section>

            <section>
              <h3 className="mb-3 font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
                Supply chain graph
              </h3>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <SupplyChainGraphView
                  graph={data.graph}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
                <NodeDetailsPanel
                  entity={entity}
                  upstream={upstream}
                  loadingUpstream={loadingUpstream}
                  onTraceUpstream={() => void onTraceUpstream()}
                />
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </>
  );
}
