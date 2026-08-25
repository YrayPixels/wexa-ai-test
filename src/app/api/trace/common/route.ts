import { AppError, toErrorResponse } from "@/lib/errors";
import { findCommonUpstream } from "@/lib/investigations";
import type { NodeLabel } from "@/lib/types";

const ALLOWED_LABELS = new Set<NodeLabel>([
  "Supplier",
  "Material",
  "MaterialBatch",
  "ProductionBatch",
  "Product",
  "Shipment",
  "Order",
  "Customer",
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      ids?: unknown;
      productIds?: unknown;
      label?: unknown;
    };
    const rawIds = Array.isArray(body.ids)
      ? body.ids
      : Array.isArray(body.productIds)
        ? body.productIds
        : [];
    const ids = rawIds.map((id) => String(id));
    const label = String(body.label ?? "Product") as NodeLabel;

    if (!ALLOWED_LABELS.has(label)) {
      throw new AppError("Unsupported entity type.", 400, "BAD_REQUEST");
    }
    if (ids.length < 2) {
      throw new AppError(
        "Select at least two rows to find shared upstream nodes.",
        400,
        "BAD_REQUEST",
      );
    }

    const matches = await findCommonUpstream(ids, label);
    return Response.json({ ids, label, matches });
  } catch (error) {
    return toErrorResponse(error);
  }
}
