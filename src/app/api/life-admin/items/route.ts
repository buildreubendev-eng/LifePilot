import { ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService } from "@/server/lifeAdminService";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const items = await getLifeAdminService().listMessages({
      category: url.searchParams.get("category") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      query: url.searchParams.get("q") ?? undefined,
      includeDisabledCategories: url.searchParams.get("includeDisabledCategories") === "true",
    });
    return ok({ items });
  } catch (error) {
    return serverError(error);
  }
}
