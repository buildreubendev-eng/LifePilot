import { badRequest, notFound, ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService, isLifeAdminAction } from "@/server/lifeAdminService";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      action?: unknown;
      snoozedUntil?: unknown;
      notes?: unknown;
      taskTitle?: unknown;
    };

    if (!isLifeAdminAction(body.action)) {
      return badRequest("Valid action is required");
    }

    const result = await getLifeAdminService().performItemAction(id, {
      action: body.action,
      snoozedUntil: typeof body.snoozedUntil === "string" ? body.snoozedUntil : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      taskTitle: typeof body.taskTitle === "string" ? body.taskTitle : undefined,
    });

    if (!result) {
      return notFound("Life-admin item not found");
    }

    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return badRequest(error.message);
    }

    return serverError(error);
  }
}
