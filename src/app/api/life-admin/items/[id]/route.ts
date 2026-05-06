import { badRequest, notFound, ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService, isLifeAdminStatus } from "@/server/lifeAdminService";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await getLifeAdminService().getMessage(id);

    if (!item) {
      return notFound("Life-admin item not found");
    }

    return ok({ item });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { status?: unknown };

    if (!isLifeAdminStatus(body.status)) {
      return badRequest("Status must be one of: new, reviewed, completed, ignored");
    }

    const item = await getLifeAdminService().updateStatus(id, body.status);

    if (!item) {
      return notFound("Life-admin item not found");
    }

    return ok({ item });
  } catch (error) {
    return serverError(error);
  }
}
