import { badRequest, notFound, ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService } from "@/server/lifeAdminService";
import { isApprovalReviewStatus } from "@/server/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      status?: unknown;
      reviewerNote?: unknown;
    };

    if (!isApprovalReviewStatus(body.status)) {
      return badRequest("Approval status must be approved or rejected");
    }

    const approval = await getLifeAdminService().reviewApproval(
      id,
      body.status,
      typeof body.reviewerNote === "string" ? body.reviewerNote : undefined,
    );

    if (!approval) {
      return notFound("Approval request not found");
    }

    return ok({ approval });
  } catch (error) {
    return serverError(error);
  }
}
