import { badRequest, notFound, ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService } from "@/server/lifeAdminService";
import { isIntegrationProvider } from "@/server/validation";
import type { IntegrationConnection, IntegrationStatus } from "@/lib/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const { provider } = await params;

    if (!isIntegrationProvider(provider)) {
      return badRequest("Invalid integration provider");
    }

    const body = (await request.json()) as {
      status?: unknown;
      permissionScopes?: unknown;
      lastSyncAt?: unknown;
      lastSyncCursor?: unknown;
      connectedAt?: unknown;
      notes?: unknown;
    };
    const patch: Partial<IntegrationConnection> = {};

    if (isIntegrationStatus(body.status)) {
      patch.status = body.status;
    }

    if (Array.isArray(body.permissionScopes)) {
      patch.permissionScopes = body.permissionScopes.filter((scope) => typeof scope === "string");
    }

    if (typeof body.lastSyncAt === "string") {
      patch.lastSyncAt = body.lastSyncAt;
    }

    if (typeof body.lastSyncCursor === "string") {
      patch.lastSyncCursor = body.lastSyncCursor;
    }

    if (typeof body.connectedAt === "string") {
      patch.connectedAt = body.connectedAt;
    }

    if (typeof body.notes === "string") {
      patch.notes = body.notes;
    }

    const integration = await getLifeAdminService().updateIntegration(provider, patch);

    if (!integration) {
      return notFound("Integration not found");
    }

    return ok({ integration });
  } catch (error) {
    return serverError(error);
  }
}

function isIntegrationStatus(value: unknown): value is IntegrationStatus {
  return value === "not_connected" || value === "connected" || value === "paused" || value === "error";
}
