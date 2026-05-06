"use client";

import { useEffect, useMemo, useState } from "react";
import { mockMessages } from "@/data/mockMessages";
import { applyStatusMap, updateStatusMap } from "@/lib/status";
import type { LifeAdminStatus, StatusMap } from "@/lib/types";

const storageKey = "plos-status-map";

export function usePlosStore() {
  const [statusMap, setStatusMap] = useState<StatusMap>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    const stored = window.localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as StatusMap) : {};
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(statusMap));
  }, [statusMap]);

  const items = useMemo(() => applyStatusMap(mockMessages, statusMap), [statusMap]);

  function setItemStatus(itemId: string, status: LifeAdminStatus) {
    setStatusMap((current) => updateStatusMap(current, itemId, status));
  }

  function resetStatuses() {
    setStatusMap({});
  }

  return {
    items,
    setItemStatus,
    resetStatuses,
  };
}
