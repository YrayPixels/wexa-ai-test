import { CatalogDetailShell } from "@/components/dashboard/CatalogDetailShell";

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CatalogDetailShell kind="materials" id={id} />;
}
