"use client";

import { useCallback, useEffect, useState } from "react";
import { mockMessages } from "@/data/mockMessages";
import type { DocumentRecord, LifeAdminAction, LifeAdminMessage, LifeAdminStatus, ManualTask } from "@/lib/types";

interface ItemActionResult {
  item: LifeAdminMessage;
  document?: DocumentRecord;
  task?: ManualTask;
}

export function usePlosStore() {
  const [items, setItems] = useState<LifeAdminMessage[]>(mockMessages);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadItems() {
      try {
        const response = await fetch("/api/life-admin/items");

        if (!response.ok) {
          throw new Error("Unable to load PLOS items");
        }

        const body = (await response.json()) as { items: LifeAdminMessage[] };

        if (active) {
          setItems(body.items);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load PLOS items");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadItems();

    return () => {
      active = false;
    };
  }, []);

  const setItemStatus = useCallback(async (itemId: string, status: LifeAdminStatus) => {
    const previousItems = items;
    setItems((current) => current.map((item) => (item.id === itemId ? { ...item, status } : item)));

    try {
      const response = await fetch(`/api/life-admin/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Unable to update item status");
      }

      const body = (await response.json()) as { item: LifeAdminMessage };
      setItems((current) => current.map((item) => (item.id === itemId ? body.item : item)));
      setError(null);
    } catch (updateError) {
      setItems(previousItems);
      setError(updateError instanceof Error ? updateError.message : "Unable to update item status");
    }
  }, [items]);

  const performItemAction = useCallback(async (itemId: string, action: LifeAdminAction, payload: Record<string, string> = {}) => {
    try {
      const response = await fetch(`/api/life-admin/items/${itemId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, ...payload }),
      });

      if (!response.ok) {
        throw new Error("Unable to complete item action");
      }

      const body = (await response.json()) as ItemActionResult;
      setItems((current) => current.map((item) => (item.id === itemId ? body.item : item)));
      setError(null);
      return body;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to complete item action");
      return null;
    }
  }, []);

  const resetStatuses = useCallback(async () => {
    try {
      const response = await fetch("/api/life-admin/reset", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Unable to reset statuses");
      }

      const body = (await response.json()) as { items: LifeAdminMessage[] };
      setItems(body.items);
      setError(null);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to reset statuses");
    }
  }, []);

  return {
    items,
    isLoading,
    error,
    setItemStatus,
    performItemAction,
    resetStatuses,
  };
}
