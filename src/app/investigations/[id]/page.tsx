import { redirect } from "next/navigation";

export default async function InvestigationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/?section=events&event=${encodeURIComponent(id)}`);
}
