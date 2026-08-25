"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardTopBar } from "@/components/dashboard/TopBar";
import { InvestigationWorkspace } from "@/components/dashboard/InvestigationWorkspace";

export function InvestigationDetailShell({
  eventId,
  banner,
}: {
  eventId: string;
  banner?: string | null;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        section="events"
        onSelectSection={(next) => {
          window.location.href = `/?section=${next}`;
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopBar
          section="events"
          crumb={eventId}
          actionLabel="View impact graph"
          onAction={() => {
            document
              .getElementById("impact-graph")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 space-y-4 px-4 pb-6 sm:px-6">
          <section className="animate-fade-up">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Investigation
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Blast-radius counts, impact graph, and entity details for this
              quality event.
            </p>
          </section>
          <InvestigationWorkspace eventId={eventId} banner={banner} />
        </main>
      </div>
    </div>
  );
}
