"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardTopBar } from "@/components/dashboard/TopBar";
import {
  BatchesTable,
  CustomersTable,
  EventsTable,
  MaterialsTable,
  OrdersTable,
  ProductsTable,
  ProductionTable,
  ShipmentsTable,
  SuppliersTable,
} from "@/components/dashboard/CatalogTables";
import type { DashboardSection, QualityEvent } from "@/lib/types";

function syncUrl(section: DashboardSection) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("section", section);
  url.searchParams.delete("event");
  url.searchParams.delete("batch");
  const next = `${url.pathname}?${url.searchParams.toString()}`;
  const current = `${window.location.pathname}${window.location.search}`;
  if (next !== current) {
    window.history.replaceState(null, "", next);
  }
}

export function TraceDashboard({
  initialSection = "events",
  banner,
}: {
  initialSection?: DashboardSection;
  banner?: string | null;
}) {
  const router = useRouter();
  const [section, setSection] = useState<DashboardSection>(initialSection);
  const [events, setEvents] = useState<QualityEvent[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
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
  }, []);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    syncUrl(section);
  }, [section]);

  const openEvent = (eventId: string) => {
    router.push(`/investigations/${encodeURIComponent(eventId)}`);
  };

  const openSection = (next: DashboardSection) => {
    setSection(next);
  };

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
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 space-y-4 px-4 pb-6 sm:px-6">
          {section === "events" ? (
            <>
              <SectionIntro
                title="Quality events"
                body="Focus list for active investigations. Open an event to trace blast radius across production, products, shipments, and customers."
              />
              {banner ? (
                <div className="rounded-[var(--card-radius)] border border-accent/20 bg-accent-soft px-4 py-3 text-sm text-ink">
                  {banner}
                </div>
              ) : null}
              <EventsTable
                events={events}
                loading={listLoading}
                error={listError}
                onRetry={() => void loadEvents()}
                onSelect={openEvent}
              />
            </>
          ) : null}

          {section === "suppliers" ? (
            <>
              <SectionIntro
                title="Suppliers"
                body="Upstream vendors in the graph. Open a supplier to see materials, batches, and any quality-event blast radius."
              />
              <SuppliersTable onOpenEvent={openEvent} />
            </>
          ) : null}

          {section === "materials" ? (
            <>
              <SectionIntro
                title="Materials"
                body="Raw ingredients and inputs. Filter by category or supplier, then open a row for batches and linked events."
              />
              <MaterialsTable onOpenEvent={openEvent} />
            </>
          ) : null}

          {section === "batches" ? (
            <>
              <SectionIntro
                title="Material batches"
                body="Search and filter batches, then open a row for full detail, graph connections, and any linked quality-event impact."
              />
              <BatchesTable onOpenEvent={openEvent} />
            </>
          ) : null}

          {section === "production" ? (
            <>
              <SectionIntro
                title="Production batches"
                body="Manufacturing runs that consume material batches and produce finished goods. Open a row for facility and impact detail."
              />
              <ProductionTable onOpenEvent={openEvent} />
            </>
          ) : null}

          {section === "products" ? (
            <>
              <SectionIntro
                title="Products"
                body="Finished goods in the graph. Select two or more rows, then find common upstream. Click a row to open the product page."
              />
              <ProductsTable onOpenEvent={openEvent} />
            </>
          ) : null}

          {section === "shipments" ? (
            <>
              <SectionIntro
                title="Shipments"
                body="Outbound shipments with search, status filters, and row-level detail pages for connection tracing."
              />
              <ShipmentsTable onOpenEvent={openEvent} />
            </>
          ) : null}

          {section === "orders" ? (
            <>
              <SectionIntro
                title="Orders"
                body="Customer orders fulfilled by shipments. Open a row for customer links and any quality-event impact."
              />
              <OrdersTable onOpenEvent={openEvent} />
            </>
          ) : null}

          {section === "customers" ? (
            <>
              <SectionIntro
                title="Customers"
                body="Recipients who may sit in a blast radius. Open any customer for orders, shipments, and linked events."
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
