import { ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService } from "@/server/lifeAdminService";

export async function GET() {
  try {
    const dashboard = await getLifeAdminService().getDashboardSummary();
    return ok({ dashboard });
  } catch (error) {
    return serverError(error);
  }
}
