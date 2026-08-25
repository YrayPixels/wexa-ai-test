import { toErrorResponse } from "@/lib/errors";
import { listSuppliers } from "@/lib/catalog";

export async function GET() {
  try {
    const suppliers = await listSuppliers();
    return Response.json({ suppliers });
  } catch (error) {
    return toErrorResponse(error);
  }
}
