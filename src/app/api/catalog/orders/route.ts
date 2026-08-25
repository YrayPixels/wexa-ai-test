import { toErrorResponse } from "@/lib/errors";
import { listOrders } from "@/lib/catalog";

export async function GET() {
  try {
    const orders = await listOrders();
    return Response.json({ orders });
  } catch (error) {
    return toErrorResponse(error);
  }
}
