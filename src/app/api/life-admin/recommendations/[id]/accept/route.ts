import { notFound, ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService } from "@/server/lifeAdminService";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await getLifeAdminService().acceptRecommendation(id);

    if (!result) {
      return notFound("Recommendation not found or no longer available");
    }

    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}
