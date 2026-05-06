"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import type { AuditEvent } from "@/lib/types";

export function ActivityView() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      const body = await fetchJson<{ auditLog: AuditEvent[] }>("/api/life-admin/audit?limit=50");
      if (active) {
        setEvents(body.auditLog);
      }
    }

    async function loadInitialEvents() {
      try {
        await loadEvents();
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load activity");
        }
      }
    }

    void loadInitialEvents();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <section className="py-4">
        <h1 className="text-4xl font-black text-stone-950">Activity</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Backend audit trail for status changes, saved documents, task creation, approvals, settings, integrations, and ingestion.
        </p>
      </section>
      {error ? <p className="rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">{error}</p> : null}
      <Section title="Audit Log">
        {events.length === 0 ? (
          <EmptyState title="No activity yet" copy="Complete an action, create an approval, or run ingestion to populate the audit log." />
        ) : (
          <div className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white shadow-sm">
            {events.map((event) => (
              <div key={event.id} className="p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold capitalize text-stone-950">{event.type.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-sm leading-6 text-stone-600">{event.summary}</p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  {event.entityType}: {event.entityId}
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
