import { ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService } from "@/server/lifeAdminService";

export async function GET() {
  try {
    const items = await getLifeAdminService().listMessages();
    return ok({ items });
  } catch (error) {
    return serverError(error);
  }
}
