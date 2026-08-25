import { CatalogDetailShell } from "@/components/dashboard/CatalogDetailShell";

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CatalogDetailShell kind="batches" id={id} />;
}
