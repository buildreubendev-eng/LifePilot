import { ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService } from "@/server/lifeAdminService";

export async function GET() {
  try {
    const runs = await getLifeAdminService().listIngestionRuns();
    return ok({ runs });
  } catch (error) {
    return serverError(error);
  }
}
