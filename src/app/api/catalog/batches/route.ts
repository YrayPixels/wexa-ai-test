import { toErrorResponse } from "@/lib/errors";
import { listBatches } from "@/lib/catalog";

export async function GET() {
  try {
    const batches = await listBatches();
    return Response.json({ batches });
  } catch (error) {
    return toErrorResponse(error);
  }
}
