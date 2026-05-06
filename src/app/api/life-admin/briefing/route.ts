import { ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService } from "@/server/lifeAdminService";

export async function GET() {
  try {
    const briefing = await getLifeAdminService().getBriefing();
    return ok({ briefing });
  } catch (error) {
    return serverError(error);
  }
}
