import { toErrorResponse } from "@/lib/errors";
import { listMaterials } from "@/lib/catalog";

export async function GET() {
  try {
    const materials = await listMaterials();
    return Response.json({ materials });
  } catch (error) {
    return toErrorResponse(error);
  }
}
