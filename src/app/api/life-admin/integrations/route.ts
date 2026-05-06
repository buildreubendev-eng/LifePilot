import { ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService } from "@/server/lifeAdminService";

export async function GET() {
  try {
    const integrations = await getLifeAdminService().listIntegrations();
    return ok({ integrations });
  } catch (error) {
    return serverError(error);
  }
}
