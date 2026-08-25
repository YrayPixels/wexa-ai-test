import { toErrorResponse } from "@/lib/errors";
import { listInvestigations } from "@/lib/investigations";

export async function GET() {
  try {
    const investigations = await listInvestigations();
    return Response.json({ investigations });
  } catch (error) {
    return toErrorResponse(error);
  }
}
