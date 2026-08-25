import { CatalogDetailShell } from "@/components/dashboard/CatalogDetailShell";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CatalogDetailShell kind="products" id={id} />;
}
