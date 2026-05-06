import { badRequest, ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService } from "@/server/lifeAdminService";
import { isApprovalActionType } from "@/server/validation";

export async function GET() {
  try {
    const approvals = await getLifeAdminService().listApprovals();
    return ok({ approvals });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      actionType?: unknown;
      title?: unknown;
      description?: unknown;
      sourceMessageId?: unknown;
      riskLevel?: unknown;
    };

    if (!isApprovalActionType(body.actionType)) {
      return badRequest("Valid approval actionType is required");
    }

    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      return badRequest("Approval title is required");
    }

    if (typeof body.description !== "string" || body.description.trim().length === 0) {
      return badRequest("Approval description is required");
    }

    const approval = await getLifeAdminService().createApproval({
      actionType: body.actionType,
      title: body.title.trim(),
      description: body.description.trim(),
      sourceMessageId: typeof body.sourceMessageId === "string" ? body.sourceMessageId : undefined,
      riskLevel: body.riskLevel === "low" || body.riskLevel === "medium" || body.riskLevel === "high" ? body.riskLevel : undefined,
    });
    return ok({ approval });
  } catch (error) {
    return serverError(error);
  }
}
