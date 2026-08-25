import { TraceDashboard } from "@/components/dashboard/TraceDashboard";
import type { DashboardSection } from "@/lib/types";

export const dynamic = "force-dynamic";

const sections = new Set<DashboardSection>([
  "events",
  "batches",
  "products",
  "shipments",
  "customers",
]);

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    section?: string;
    event?: string;
    batch?: string;
  }>;
}) {
  const params = await searchParams;
  const section = sections.has(params.section as DashboardSection)
    ? (params.section as DashboardSection)
    : params.event
      ? "events"
      : "events";

  return (
    <TraceDashboard
      initialSection={section}
      initialEventId={params.event}
      initialBatchId={params.batch}
    />
  );
}
