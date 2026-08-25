import { toErrorResponse } from "@/lib/errors";
import { getCatalogEntityDetail } from "@/lib/catalog";
import type { CatalogKind } from "@/lib/types";

const kinds = new Set<CatalogKind>([
  "suppliers",
  "materials",
  "batches",
  "production",
  "products",
  "shipments",
  "orders",
  "customers",
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  try {
    const { kind, id } = await params;
    if (!kinds.has(kind as CatalogKind)) {
      return Response.json({ error: "Unknown catalog kind." }, { status: 404 });
    }
    const detail = await getCatalogEntityDetail(id, kind as CatalogKind);
    return Response.json(detail);
  } catch (error) {
    return toErrorResponse(error);
  }
}
