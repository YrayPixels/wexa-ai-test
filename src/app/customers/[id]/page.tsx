import { CatalogDetailShell } from "@/components/dashboard/CatalogDetailShell";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CatalogDetailShell kind="customers" id={id} />;
}
