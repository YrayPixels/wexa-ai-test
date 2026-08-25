import { toErrorResponse } from "@/lib/errors";
import { getInvestigation } from "@/lib/investigations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const investigation = await getInvestigation(id);
    return Response.json(investigation);
  } catch (error) {
    return toErrorResponse(error);
  }
}
