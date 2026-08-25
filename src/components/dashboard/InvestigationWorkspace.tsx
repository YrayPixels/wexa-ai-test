"use client";

import { useCallback, useEffect, useState } from "react";
import { ImpactHeroCard } from "@/components/dashboard/ImpactHeroCard";
import { EventStatusCard } from "@/components/dashboard/EventStatusCard";
import { NodeDetailsPanel } from "@/components/NodeDetails";
import { SupplyChainGraphView } from "@/components/SupplyChainGraph";
import { ErrorState, LoadingState } from "@/components/States";
import type {
  EntityDetail,
  InvestigationDetail,
  TraceStep,
} from "@/lib/types";

function ImpactBreakdown({
  impact,
}: {
  impact: InvestigationDetail["impact"];
}) {
  const rows = [
    { label: "Production batches", value: impact.productionBatches },
    { label: "Finished products", value: impact.products },
    { label: "Shipments", value: impact.shipments },
    { label: "Customer orders", value: impact.orders },
    { label: "Customers", value: impact.customers },
  ];
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <section className="dashboard-card h-full p-5 animate-fade-up">
      <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
        Downstream reach
      </p>
      <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-ink">
        Impact by stage
      </h3>
      <ul className="mt-5 space-y-4">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-muted">{row.label}</span>
              <span className="font-semibold tabular-nums text-ink">{row.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${Math.max(8, (row.value / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function InvestigationWorkspace({
  eventId,
  banner,
}: {
  eventId: string;
  banner?: string | null;
}) {
  const [detail, setDetail] = useState<InvestigationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [entity, setEntity] = useState<EntityDetail | null>(null);
  const [upstream, setUpstream] = useState<TraceStep[] | null>(null);
  const [loadingUpstream, setLoadingUpstream] = useState(false);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setNodeId(null);
    setEntity(null);
    setUpstream(null);
    try {
      const response = await fetch(`/api/investigations/${id}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to load investigation");
      setDetail(payload as InvestigationDetail);
    } catch (err) {
      setDetail(null);
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
    if (!nodeId) {
      setEntity(null);
      setUpstream(null);
      return;
    }
    let active = true;
    setUpstream(null);
    fetch(`/api/entities/${nodeId}`)
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
  }, [nodeId]);

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

  if (loading) return <LoadingState label="Tracing impact…" />;
  if (error) {
    return <ErrorState message={error} onRetry={() => void load(eventId)} />;
  }
  if (!detail) return null;

  return (
    <div className="space-y-4">
      {banner ? (
        <div className="rounded-[var(--card-radius)] border border-accent/20 bg-accent-soft px-4 py-3 text-sm text-ink">
          {banner}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ImpactHeroCard event={detail.event} impact={detail.impact} />
        </div>
        <div className="lg:col-span-5" id="impact-graph">
          <div className="h-full min-h-[320px]">
            <SupplyChainGraphView
              graph={detail.graph}
              selectedId={nodeId}
              onSelect={setNodeId}
            />
          </div>
        </div>
        <div className="lg:col-span-3">
          <EventStatusCard event={detail.event} />
        </div>
        <div className="lg:col-span-4">
          <ImpactBreakdown impact={detail.impact} />
        </div>
        <div className="lg:col-span-5">
          <NodeDetailsPanel
            entity={entity}
            upstream={upstream}
            loadingUpstream={loadingUpstream}
            onTraceUpstream={() => void onTraceUpstream()}
          />
        </div>
      </div>
    </div>
  );
}
