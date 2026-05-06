import { ok, serverError } from "@/server/apiResponses";
import { getLifeAdminService } from "@/server/lifeAdminService";

export async function GET() {
  try {
    const tasks = await getLifeAdminService().listTasks();
    return ok({ tasks });
  } catch (error) {
    return serverError(error);
  }
}
