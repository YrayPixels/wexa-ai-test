import { CatalogDetailShell } from "@/components/dashboard/CatalogDetailShell";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CatalogDetailShell kind="orders" id={id} />;
}
