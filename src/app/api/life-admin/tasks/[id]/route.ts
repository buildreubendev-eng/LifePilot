import { badRequest, notFound, ok, serverError } from "@/server/apiResponses";
import { isLifeAdminStatus } from "@/server/lifeAdminService";
import { getLifeAdminService } from "@/server/lifeAdminService";
import { isLifeAdminCategory, isPriority } from "@/server/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim().length === 0) {
        return badRequest("Task title must be a non-empty string");
      }
      patch.title = body.title.trim();
    }

    if (body.category !== undefined) {
      if (!isLifeAdminCategory(body.category)) {
        return badRequest("Invalid task category");
      }
      patch.category = body.category;
    }

    if (body.priority !== undefined) {
      if (!isPriority(body.priority)) {
        return badRequest("Invalid task priority");
      }
      patch.priority = body.priority;
    }

    if (body.status !== undefined) {
      if (!isLifeAdminStatus(body.status)) {
        return badRequest("Invalid task status");
      }
      patch.status = body.status;
    }

    if (body.dueDate !== undefined && typeof body.dueDate === "string") {
      patch.dueDate = body.dueDate;
    }

    if (body.suggestedAction !== undefined && typeof body.suggestedAction === "string") {
      patch.suggestedAction = body.suggestedAction;
    }

    if (body.snoozedUntil !== undefined && typeof body.snoozedUntil === "string") {
      patch.snoozedUntil = body.snoozedUntil;
    }

    const task = await getLifeAdminService().updateManualTask(id, patch);

    if (!task) {
      return notFound("Task not found");
    }

    return ok({ task });
  } catch (error) {
    return serverError(error);
  }
}
