import type { LifeAdminMessage, LifeAdminStatus, StatusMap } from "@/lib/types";

export function applyStatusMap(items: LifeAdminMessage[], statusMap: StatusMap): LifeAdminMessage[] {
  return items.map((item) => ({
    ...item,
    status: statusMap[item.id] ?? item.status,
  }));
}

export function updateStatusMap(statusMap: StatusMap, itemId: string, status: LifeAdminStatus): StatusMap {
  return {
    ...statusMap,
    [itemId]: status,
  };
}
