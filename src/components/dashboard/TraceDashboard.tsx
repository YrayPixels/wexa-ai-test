"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardTopBar } from "@/components/dashboard/TopBar";
import { InvestigationWorkspace } from "@/components/dashboard/InvestigationWorkspace";
import {
  BatchesTable,
  CustomersTable,
  EventsTable,
  ProductsTable,
  ShipmentsTable,
} from "@/components/dashboard/CatalogTables";
import type { BatchRow, DashboardSection, QualityEvent } from "@/lib/types";

function syncUrl(section: DashboardSection, eventId: string | null, batchId: string | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("section", section);
  if (eventId) url.searchParams.set("event", eventId);
  else url.searchParams.delete("event");
  if (batchId) url.searchParams.set("batch", batchId);
  else url.searchParams.delete("batch");
  const next = `${url.pathname}?${url.searchParams.toString()}`;
  const current = `${window.location.pathname}${window.location.search}`;
  if (next !== current) {
    window.history.replaceState(null, "", next);
  }
}

export function TraceDashboard({
  initialSection = "events",
  initialEventId,
  initialBatchId,
}: {
  initialSection?: DashboardSection;
  initialEventId?: string;
  initialBatchId?: string;
}) {
  const [section, setSection] = useState<DashboardSection>(initialSection);
  const [events, setEvents] = useState<QualityEvent[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    initialEventId ?? null,
  );
  const [selectedBatch, setSelectedBatch] = useState<BatchRow | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bootstrapped = useRef(false);

  const loadEvents = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const response = await fetch("/api/investigations");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load investigations");
      }
      const list = (payload.investigations ?? payload) as QualityEvent[];
      setEvents(list);

      setSelectedEventId((current) => {
        if (current && list.some((e) => e.id === current)) return current;
        if (initialEventId && list.some((e) => e.id === initialEventId)) {
          return initialEventId;
        }
        return null;
      });
    } catch (err) {
      setEvents([]);
      setListError(
        err instanceof Error
          ? err.message
          : "The graph database is currently unavailable.",
      );
    } finally {
      setListLoading(false);
    }
  }, [initialEventId]);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    syncUrl(section, selectedEventId, selectedBatch?.id ?? initialBatchId ?? null);
  }, [section, selectedEventId, selectedBatch, initialBatchId]);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const openEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedBatch(null);
    setSection("events");
  };

  const openSection = (next: DashboardSection) => {
    setSection(next);
    if (next !== "events") setSelectedEventId(null);
    if (next !== "batches") setSelectedBatch(null);
  };

  const onSelectBatch = (batch: BatchRow) => {
    setSelectedBatch(batch);
    if (batch.event) {
      setSelectedEventId(batch.event.id);
    } else {
      setSelectedEventId(null);
    }
  };

  const topCrumb =
    section === "events"
      ? selectedEventId
      : section === "batches"
        ? selectedBatch?.batchNumber ?? null
        : null;

  const topStatus =
    section === "events"
      ? selectedEvent?.status ?? null
      : selectedBatch?.event
        ? `Linked to ${selectedBatch.event.id}`
        : selectedBatch
          ? "No linked event"
          : null;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        section={section}
        onSelectSection={openSection}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopBar
          section={section}
          crumb={topCrumb}
          status={topStatus}
          actionLabel={
            section === "events" && selectedEventId
              ? "View impact graph"
              : section === "batches" && selectedBatch?.event
                ? "View batch impact"
                : null
          }
          onAction={
            (section === "events" && selectedEventId) ||
            (section === "batches" && selectedBatch?.event)
              ? () => {
                  document
                    .getElementById("impact-graph")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              : undefined
          }
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 space-y-4 px-4 pb-6 sm:px-6">
          {section === "events" ? (
            <>
              <SectionIntro
                title="Quality events"
                body="Focus list for active investigations. Open an event to trace blast radius across production, products, shipments, and customers."
              />
              <EventsTable
                events={events}
                selectedId={selectedEventId}
                loading={listLoading}
                error={listError}
                onRetry={() => void loadEvents()}
                onSelect={openEvent}
              />
              {selectedEventId ? (
                <InvestigationWorkspace eventId={selectedEventId} />
              ) : null}
            </>
          ) : null}

          {section === "batches" ? (
            <>
              <SectionIntro
                title="Material batches"
                body="Browse ingredient and component batches. If a batch is linked to a quality event, open it to see how far the contamination reaches."
              />
              <BatchesTable
                selectedId={selectedBatch?.id ?? null}
                onSelectBatch={onSelectBatch}
                onOpenEvent={openEvent}
              />
              {selectedBatch?.event ? (
                <InvestigationWorkspace
                  eventId={selectedBatch.event.id}
                  banner={`Batch ${selectedBatch.batchNumber} is linked to ${selectedBatch.event.id} (${selectedBatch.event.type}). Downstream impact is shown below.`}
                />
              ) : selectedBatch ? (
                <div className="dashboard-card px-5 py-6 animate-fade-up">
                  <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                    Batch detail
                  </p>
                  <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
                    {selectedBatch.batchNumber}
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    {selectedBatch.materialName} from {selectedBatch.supplierName}. Status:{" "}
                    {selectedBatch.status}.
                  </p>
                  <p className="mt-4 rounded-xl bg-surface-muted px-4 py-3 text-sm text-muted">
                    No quality event is linked to this batch, so there is no recall blast
                    radius to display.
                  </p>
                </div>
              ) : null}
            </>
          ) : null}

          {section === "products" ? (
            <>
              <SectionIntro
                title="Products"
                body="Finished goods in the graph. Linked-event chips mark products that sit downstream of a quality incident."
              />
              <ProductsTable onOpenEvent={openEvent} />
            </>
          ) : null}

          {section === "shipments" ? (
            <>
              <SectionIntro
                title="Shipments"
                body="Outbound shipments and the customers they fulfill. Affected lanes show their upstream quality event."
              />
              <ShipmentsTable onOpenEvent={openEvent} />
            </>
          ) : null}

          {section === "customers" ? (
            <>
              <SectionIntro
                title="Customers"
                body="Recipients who may be in the blast radius of a contaminated batch."
              />
              <CustomersTable onOpenEvent={openEvent} />
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function SectionIntro({ title, body }: { title: string; body: string }) {
  return (
    <section className="animate-fade-up">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{body}</p>
    </section>
  );
}
