import { InvestigationDetailShell } from "@/components/dashboard/InvestigationDetailShell";

export default async function InvestigationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ banner?: string }>;
}) {
  const { id } = await params;
  const { banner } = await searchParams;
  return <InvestigationDetailShell eventId={id} banner={banner ?? null} />;
}
