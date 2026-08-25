import { toErrorResponse } from "@/lib/errors";
import { listCustomers } from "@/lib/catalog";

export async function GET() {
  try {
    const customers = await listCustomers();
    return Response.json({ customers });
  } catch (error) {
    return toErrorResponse(error);
  }
}
