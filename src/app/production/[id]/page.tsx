import { CatalogDetailShell } from "@/components/dashboard/CatalogDetailShell";

export default async function ProductionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CatalogDetailShell kind="production" id={id} />;
}
