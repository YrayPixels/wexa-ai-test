import { toErrorResponse } from "@/lib/errors";
import { listShipments } from "@/lib/catalog";

export async function GET() {
  try {
    const shipments = await listShipments();
    return Response.json({ shipments });
  } catch (error) {
    return toErrorResponse(error);
  }
}
