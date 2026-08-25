import { CatalogDetailShell } from "@/components/dashboard/CatalogDetailShell";

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CatalogDetailShell kind="shipments" id={id} />;
}
