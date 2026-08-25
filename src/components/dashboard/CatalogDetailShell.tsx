"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardTopBar } from "@/components/dashboard/TopBar";
import { EntityDetailView } from "@/components/dashboard/EntityDetailView";
import type { CatalogKind, DashboardSection } from "@/lib/types";

const kindToSection: Record<CatalogKind, DashboardSection> = {
  suppliers: "suppliers",
  materials: "materials",
  batches: "batches",
  production: "production",
  products: "products",
  shipments: "shipments",
  orders: "orders",
  customers: "customers",
};

export function CatalogDetailShell({
  kind,
  id,
}: {
  kind: CatalogKind;
  id: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const section = kindToSection[kind] ?? "events";

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        section={section}
        onSelectSection={(next) => {
          window.location.href = `/?section=${next}`;
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopBar
          section={section}
          crumb={id}
          actionLabel="View connection graph"
          onAction={() => {
            document
              .getElementById("connection-graph")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 px-4 pb-6 sm:px-6">
          <EntityDetailView kind={kind} id={id} />
        </main>
      </div>
    </div>
  );
}
