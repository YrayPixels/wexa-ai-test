import { AppError, toErrorResponse } from "@/lib/errors";
import { getEntity } from "@/lib/investigations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      throw new AppError("Entity id is required.", 400, "BAD_REQUEST");
    }
    const entity = await getEntity(id);
    return Response.json(entity);
  } catch (error) {
    return toErrorResponse(error);
  }
}
