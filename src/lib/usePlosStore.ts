"use client";

import { useCallback, useEffect, useState } from "react";
import { mockMessages } from "@/data/mockMessages";
import type { LifeAdminMessage, LifeAdminStatus } from "@/lib/types";

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
    resetStatuses,
  };
}
