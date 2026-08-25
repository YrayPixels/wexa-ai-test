import { AppError, toErrorResponse } from "@/lib/errors";
import { findCommonUpstream } from "@/lib/investigations";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { productIds?: unknown };
    const productIds = Array.isArray(body.productIds)
      ? body.productIds.map((id) => String(id))
      : [];
    if (productIds.length < 2) {
      throw new AppError(
        "Select at least two products to find shared upstream nodes.",
        400,
        "BAD_REQUEST",
      );
    }
    const matches = await findCommonUpstream(productIds);
    return Response.json({ productIds, matches });
  } catch (error) {
    return toErrorResponse(error);
  }
}
