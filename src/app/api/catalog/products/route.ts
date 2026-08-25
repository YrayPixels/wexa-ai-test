import { toErrorResponse } from "@/lib/errors";
import { listProducts } from "@/lib/catalog";

export async function GET() {
  try {
    const products = await listProducts();
    return Response.json({ products });
  } catch (error) {
    return toErrorResponse(error);
  }
}
