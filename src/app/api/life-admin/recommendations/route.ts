import { ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService } from "@/server/lifeAdminService";

export async function GET() {
  try {
    const recommendations = await getLifeAdminService().listRecommendations();
    return ok({ recommendations });
  } catch (error) {
    return serverError(error);
  }
}
