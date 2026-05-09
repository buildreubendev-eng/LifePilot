"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/apiClient";

interface HealthResponse {
  ok: boolean;
  repository: "json" | "prisma";
  counts: {
    messages: number;
    integrations: number;
  };
}

export function BackendStatusPill() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadHealth() {
      try {
        const body = await fetchJson<HealthResponse>("/api/life-admin/health");

        if (active) {
          setHealth(body);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Health check failed");
        }
      }
    }

    void loadHealth();

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 px-3 py-2.5 text-center ring-1 ring-red-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-red-700">Backend check failed</p>
        <p className="mt-0.5 line-clamp-2 text-[10px] text-red-600">{error}</p>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="rounded-lg bg-stone-50 px-3 py-2.5 text-center ring-1 ring-stone-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Checking backend</p>
        <p className="mt-0.5 text-[10px] text-stone-400">Loading status...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-emerald-50 px-3 py-2.5 text-center ring-1 ring-emerald-100">
      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
        {health.repository} backend healthy
      </p>
      <p className="mt-0.5 text-[10px] text-emerald-600">
        {health.counts.messages} items | {health.counts.integrations} connectors
      </p>
    </div>
  );
}
