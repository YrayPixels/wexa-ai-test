import { toErrorResponse } from "@/lib/errors";
import { listProduction } from "@/lib/catalog";

export async function GET() {
  try {
    const production = await listProduction();
    return Response.json({ production });
  } catch (error) {
    return toErrorResponse(error);
  }
}
