import { badRequest, notFound, ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService } from "@/server/lifeAdminService";
import { isIntegrationProvider } from "@/server/validation";

export async function POST(_request: Request, { params }: { params: Promise<unknown> }) {
  try {
    const provider = getProvider(await params);

    if (!isIntegrationProvider(provider)) {
      return badRequest("Invalid integration provider");
    }

    const integration = await getLifeAdminService().disconnectIntegration(provider);

    if (!integration) {
      return notFound("Integration not found");
    }

    return ok({ integration });
  } catch (error) {
    return serverError(error);
  }
}

function getProvider(params: unknown): unknown {
  return params && typeof params === "object" && "provider" in params ? params.provider : undefined;
}
