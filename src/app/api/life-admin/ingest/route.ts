import { badRequest, ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService } from "@/server/lifeAdminService";
import { isRawMessageProvider } from "@/server/validation";
import type { RawLifeAdminMessage } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      provider?: unknown;
      messages?: unknown;
      notes?: unknown;
    };

    if (!isRawMessageProvider(body.provider)) {
      return badRequest("Valid ingestion provider is required");
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return badRequest("At least one raw message is required");
    }

    const messages = body.messages.map((message) => normalizeRawMessage(message)).filter((message) => message !== null);

    if (messages.length !== body.messages.length) {
      return badRequest("Each raw message requires source, sender, subject, body, and receivedAt");
    }

    const result = await getLifeAdminService().ingestRawMessages({
      provider: body.provider,
      messages,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });
    return ok(result);
  } catch (error) {
    return serverError(error);
  }
}

function normalizeRawMessage(value: unknown): (Omit<RawLifeAdminMessage, "id" | "provider"> & { id?: string }) | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.source !== "string" ||
    typeof candidate.sender !== "string" ||
    typeof candidate.subject !== "string" ||
    typeof candidate.body !== "string" ||
    typeof candidate.receivedAt !== "string"
  ) {
    return null;
  }

  return {
    id: typeof candidate.id === "string" ? candidate.id : undefined,
    source: candidate.source as RawLifeAdminMessage["source"],
    sender: candidate.sender,
    subject: candidate.subject,
    body: candidate.body,
    receivedAt: candidate.receivedAt,
    externalId: typeof candidate.externalId === "string" ? candidate.externalId : undefined,
  };
}
