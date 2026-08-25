"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EventPills } from "@/components/dashboard/DataTable";
import { SupplyChainGraphView } from "@/components/SupplyChainGraph";
import { SeverityBadge } from "@/components/SeverityBadge";
import { ErrorState, LoadingState } from "@/components/States";
import type { CatalogEntityDetail, CatalogKind, NodeLabel } from "@/lib/types";

const kindMeta: Record<
  CatalogKind,
  { label: string; listHref: string; section: string }
> = {
  suppliers: {
    label: "Suppliers",
    listHref: "/?section=suppliers",
    section: "suppliers",
  },
  materials: {
    label: "Materials",
    listHref: "/?section=materials",
    section: "materials",
  },
  batches: { label: "Batches", listHref: "/?section=batches", section: "batches" },
  production: {
    label: "Production",
    listHref: "/?section=production",
    section: "production",
  },
  products: { label: "Products", listHref: "/?section=products", section: "products" },
  shipments: {
    label: "Shipments",
    listHref: "/?section=shipments",
    section: "shipments",
  },
  orders: { label: "Orders", listHref: "/?section=orders", section: "orders" },
  customers: {
    label: "Customers",
    listHref: "/?section=customers",
    section: "customers",
  },
};

function resolveKindMeta(
  kind: CatalogKind,
): { label: string; listHref: string; section: string } {
  return (
    kindMeta[kind] ?? {
      label: kind.charAt(0).toUpperCase() + kind.slice(1),
      listHref: `/?section=${encodeURIComponent(kind)}`,
      section: kind,
    }
  );
}

function hrefForNeighbor(label: NodeLabel, id: string): string | null {
  switch (label) {
    case "Supplier":
      return `/suppliers/${id}`;
    case "Material":
      return `/materials/${id}`;
    case "MaterialBatch":
      return `/batches/${id}`;
    case "ProductionBatch":
      return `/production/${id}`;
    case "Product":
      return `/products/${id}`;
    case "Shipment":
      return `/shipments/${id}`;
    case "Order":
      return `/orders/${id}`;
    case "Customer":
      return `/customers/${id}`;
    case "QualityEvent":
      return `/?section=events&event=${encodeURIComponent(id)}`;
    default:
      return null;
  }
}

export function EntityDetailView({
  kind,
  id,
}: {
  kind: CatalogKind;
  id: string;
}) {
  const [detail, setDetail] = useState<CatalogEntityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    setSelectedNodeId(null);
    fetch(`/api/catalog/${kind}/${encodeURIComponent(id)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Failed to load entity");
        setDetail(payload as CatalogEntityDetail);
      })
      .catch((err: unknown) => {
        setDetail(null);
        setError(err instanceof Error ? err.message : "Failed to load entity");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [kind, id]);

  if (loading) return <LoadingState label="Loading entity detail…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!detail) return null;

  const meta = resolveKindMeta(detail.kind ?? kind);
  const propertyEntries = Object.entries(detail.properties ?? {}).filter(
    ([key]) => key !== "id",
  );
  const primaryEventId = detail.events?.[0]?.id ?? null;
  const connections = detail.connections ?? [];
  const events = detail.events ?? [];
  const graph = detail.graph ?? { nodes: [], edges: [] };
  const upstream = connections.filter((c) => c.direction === "IN");
  const downstream = connections.filter((c) => c.direction === "OUT");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={meta.listHref}
          className="font-mono text-xs tracking-wide text-muted uppercase transition hover:text-accent"
        >
          ← Back to {meta.label}
        </Link>
      </div>

      <section className="dashboard-card-accent relative overflow-hidden p-6 animate-fade-up">
        <p className="text-xs font-medium tracking-wide text-white/80 uppercase">
          {detail.label}
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
          {detail.title}
        </h2>
        {detail.subtitle ? (
          <p className="mt-2 text-sm text-white/85">{detail.subtitle}</p>
        ) : null}
        <p className="mt-3 font-mono text-xs text-white/70">{detail.id}</p>
        <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/15 px-3 py-3">
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums">
              {graph.nodes.length}
            </p>
            <p className="text-[11px] tracking-wide text-white/75 uppercase">Nodes</p>
          </div>
          <div className="rounded-2xl bg-white/15 px-3 py-3">
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums">
              {graph.edges.length}
            </p>
            <p className="text-[11px] tracking-wide text-white/75 uppercase">Links</p>
          </div>
          <div className="rounded-2xl bg-white/15 px-3 py-3">
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums">
              {upstream.length}
            </p>
            <p className="text-[11px] tracking-wide text-white/75 uppercase">Upstream</p>
          </div>
          <div className="rounded-2xl bg-white/15 px-3 py-3">
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums">
              {downstream.length}
            </p>
            <p className="text-[11px] tracking-wide text-white/75 uppercase">Downstream</p>
          </div>
        </div>
      </section>

      <section id="connection-graph">
        <SupplyChainGraphView
          graph={graph}
          focusId={detail.id}
          selectedId={selectedNodeId ?? detail.id}
          onSelect={setSelectedNodeId}
          title={`Connections for ${detail.title}`}
          subtitle="Centered on this entity — upstream suppliers/batches and downstream products, shipments, and customers"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="dashboard-card p-5 lg:col-span-4 animate-fade-up">
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
            Properties
          </p>
          <dl className="mt-4 space-y-3">
            {propertyEntries.map(([key, value]) => (
              <div key={key} className="border-b border-border/60 pb-3 last:border-0">
                <dt className="font-mono text-[10px] tracking-wider text-muted uppercase">
                  {key}
                </dt>
                <dd className="mt-1 text-sm text-ink">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="dashboard-card p-5 lg:col-span-4 animate-fade-up">
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
            Direct connections
          </p>
          <p className="mt-1 text-sm text-muted">
            {connections.length} one-hop neighbors
          </p>
          {connections.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No direct graph neighbors for this item.
            </p>
          ) : (
            <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {connections.map((connection) => {
                const href = hrefForNeighbor(connection.label, connection.id);
                const content = (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] tracking-wide text-accent uppercase">
                        {connection.direction === "OUT" ? "→" : "←"} {connection.type}
                      </span>
                      <span className="font-mono text-[10px] text-muted">
                        {connection.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-ink">{connection.title}</p>
                    {connection.subtitle ? (
                      <p className="text-xs text-muted">{connection.subtitle}</p>
                    ) : null}
                  </>
                );

                return (
                  <li key={`${connection.id}-${connection.type}-${connection.direction}`}>
                    {href ? (
                      <Link
                        href={href}
                        className="block rounded-xl border border-border px-3 py-2.5 transition hover:border-accent hover:bg-accent-soft/40"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="rounded-xl border border-border px-3 py-2.5">
                        {content}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="dashboard-card p-5 lg:col-span-4 animate-fade-up">
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
            Linked quality events
          </p>
          {events.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Not currently inside a quality-event blast radius.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="rounded-xl border border-border bg-surface-muted/40 px-3 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={event.severity} />
                    <span className="font-mono text-xs text-accent">{event.id}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-ink">{event.type}</p>
                  {event.status ? (
                    <p className="mt-1 text-xs text-muted">{event.status}</p>
                  ) : null}
                  <Link
                    href={`/?section=events&event=${encodeURIComponent(event.id)}`}
                    className="mt-3 inline-flex text-xs font-semibold text-accent hover:underline"
                  >
                    Open event investigation →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {primaryEventId ? (
        <section className="dashboard-card p-5 animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                Optional recall impact
              </p>
              <p className="mt-1 text-sm text-muted">
                This entity is linked to {primaryEventId}. Open the full event
                blast-radius investigation.
              </p>
            </div>
            <Link
              href={`/investigations/${encodeURIComponent(primaryEventId)}`}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
            >
              Open investigation
            </Link>
          </div>
          {events.length > 1 ? (
            <div className="mt-4">
              <EventPills
                events={events}
                onOpenEvent={(eventId) => {
                  window.location.href = `/investigations/${encodeURIComponent(eventId)}`;
                }}
              />
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
