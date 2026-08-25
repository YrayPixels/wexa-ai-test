import { AppError, toErrorResponse } from "@/lib/errors";
import { reverseTrace } from "@/lib/investigations";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      throw new AppError("productId is required.", 400, "BAD_REQUEST");
    }
    const steps = await reverseTrace(productId);
    return Response.json({ productId, steps });
  } catch (error) {
    return toErrorResponse(error);
  }
}
