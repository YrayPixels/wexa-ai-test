import { redirect } from "next/navigation";
import { TraceDashboard } from "@/components/dashboard/TraceDashboard";
import { getEventIdForBatch } from "@/lib/catalog";
import type { DashboardSection } from "@/lib/types";

export const dynamic = "force-dynamic";

const sections = new Set<DashboardSection>([
  "events",
  "suppliers",
  "materials",
  "batches",
  "production",
  "products",
  "shipments",
  "orders",
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
  let eventId = params.event;
  let banner: string | null = null;

  if (params.batch) {
    try {
      const resolved = await getEventIdForBatch(params.batch);
      if (resolved.eventId) {
        if (!eventId) eventId = resolved.eventId;
        banner = `Opened from material batch ${resolved.batchNumber}.`;
      } else {
        banner = `Material batch ${resolved.batchNumber} has no linked quality event.`;
      }
    } catch {
      banner = `Could not resolve batch ${params.batch}.`;
    }
  }

  if (eventId) {
    const qs = banner
      ? `?banner=${encodeURIComponent(banner)}`
      : "";
    redirect(`/investigations/${encodeURIComponent(eventId)}${qs}`);
  }

  const section = sections.has(params.section as DashboardSection)
    ? (params.section as DashboardSection)
    : "events";

  return <TraceDashboard initialSection={section} banner={banner} />;
}
