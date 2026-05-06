import { badRequest, ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService } from "@/server/lifeAdminService";
import { isLifeAdminCategory, isPriority } from "@/server/validation";

export async function GET() {
  try {
    const tasks = await getLifeAdminService().listTasks();
    return ok({ tasks });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: unknown;
      category?: unknown;
      dueDate?: unknown;
      priority?: unknown;
      suggestedAction?: unknown;
      sourceMessageId?: unknown;
    };

    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      return badRequest("Task title is required");
    }

    if (!isLifeAdminCategory(body.category)) {
      return badRequest("Valid task category is required");
    }

    if (body.priority !== undefined && !isPriority(body.priority)) {
      return badRequest("Priority must be low, medium, high, or urgent");
    }

    const task = await getLifeAdminService().createManualTask({
      title: body.title.trim(),
      category: body.category,
      dueDate: typeof body.dueDate === "string" ? body.dueDate : undefined,
      priority: body.priority,
      suggestedAction: typeof body.suggestedAction === "string" ? body.suggestedAction : undefined,
      sourceMessageId: typeof body.sourceMessageId === "string" ? body.sourceMessageId : undefined,
    });
    return ok({ task });
  } catch (error) {
    return serverError(error);
  }
}
