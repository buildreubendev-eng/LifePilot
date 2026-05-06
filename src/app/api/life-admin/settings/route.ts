import { badRequest, ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService } from "@/server/lifeAdminService";
import { isLifeAdminCategory } from "@/server/validation";
import type { UserSettings } from "@/lib/types";

export async function GET() {
  try {
    const settings = await getLifeAdminService().getSettings();
    return ok({ settings });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Partial<UserSettings>;

    if (body.disabledCategories?.some((category) => !isLifeAdminCategory(category))) {
      return badRequest("disabledCategories contains an invalid category");
    }

    const settings = await getLifeAdminService().updateSettings(body);
    return ok({ settings });
  } catch (error) {
    return serverError(error);
  }
}
