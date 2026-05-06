import { ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService } from "@/server/lifeAdminService";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "100");
    const auditLog = await getLifeAdminService().listAuditEvents(Number.isFinite(limit) ? limit : 100);
    return ok({ auditLog });
  } catch (error) {
    return serverError(error);
  }
}
