import { CatalogDetailShell } from "@/components/dashboard/CatalogDetailShell";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CatalogDetailShell kind="suppliers" id={id} />;
}
