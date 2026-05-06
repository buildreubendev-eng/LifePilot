"use client";

import { useEffect, useState } from "react";
import { ItemCard } from "@/components/ItemCard";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import { generateTasks } from "@/lib/prioritization";
import type { LifeAdminTask } from "@/lib/types";
import { usePlosStore } from "@/lib/usePlosStore";

export function TasksView() {
  const { items } = usePlosStore();
  const [backendTasks, setBackendTasks] = useState<LifeAdminTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const tasks = (backendTasks.length > 0 ? backendTasks : generateTasks(items)).filter((task) => task.status !== "completed");

  useEffect(() => {
    let active = true;

    async function loadTasks() {
      const body = await fetchJson<{ tasks: LifeAdminTask[] }>("/api/life-admin/tasks");
      if (active) {
        setBackendTasks(body.tasks);
      }
    }

    async function loadInitialTasks() {
      try {
        await loadTasks();
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load backend tasks");
        }
      }
    }

    void loadInitialTasks();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <section className="py-4">
        <h1 className="text-4xl font-black text-stone-950">Tasks</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Generated from the AI Inbox with scoring based on deadline proximity, financial impact, category importance, confidence, and overdue status.
        </p>
      </section>
      {error ? <p className="rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">{error}</p> : null}
      <Section title="Ranked Action List">
        <div className="grid gap-3">
          {tasks.map((task) => (
            <ItemCard key={task.id} task={task} />
          ))}
        </div>
      </Section>
    </div>
  );
}
