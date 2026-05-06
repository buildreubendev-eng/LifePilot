import { ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService } from "@/server/lifeAdminService";

export async function POST() {
  try {
    await getLifeAdminService().resetStatuses();
    const items = await getLifeAdminService().listMessages();
    return ok({ items });
  } catch (error) {
    return serverError(error);
  }
}
