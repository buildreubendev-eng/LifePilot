"use client";

import { useCallback, useEffect, useState } from "react";
import { ItemCard } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { Section } from "@/components/Section";
import { TaskModal } from "@/components/TaskModal";
import { fetchJson } from "@/lib/apiClient";
import type { LifeAdminTask, ManualTask } from "@/lib/types";

type StatusFilter = "active" | "completed" | "all";

export function TasksView() {
  const [tasks, setTasks] = useState<LifeAdminTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const body = await fetchJson<{ tasks: LifeAdminTask[] }>("/api/life-admin/tasks");
      setTasks(body.tasks);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load tasks");
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function init() {
      await loadTasks();
      if (active) {
        setIsLoading(false);
      }
    }

    void init();
    return () => {
      active = false;
    };
  }, [loadTasks]);

  async function handleCreateTask(title: string, notes: string) {
    try {
      await fetchJson<{ task: ManualTask }>("/api/life-admin/tasks", {
        method: "POST",
        body: JSON.stringify({
          title,
          category: "personal reply",
          priority: "medium",
          suggestedAction: notes || title,
        }),
      });
      setIsCreateOpen(false);
      setSuccessMessage(`Task "${title}" created.`);
      await loadTasks();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create task");
    }
  }

  const filtered = tasks.filter((task) => {
    if (statusFilter === "active") return task.status !== "completed" && task.status !== "ignored";
    if (statusFilter === "completed") return task.status === "completed" || task.status === "ignored";
    return true;
  });

  const activeTasks = tasks.filter((t) => t.status !== "completed" && t.status !== "ignored");
  const completedTasks = tasks.filter((t) => t.status === "completed" || t.status === "ignored");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900" />
          <p className="mt-4 text-sm font-semibold text-stone-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-black text-stone-950">Tasks</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
              Generated from the AI Inbox with scoring based on deadline proximity, financial impact, category importance, confidence, and overdue status.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="shrink-0 rounded-md bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
          >
            Create Task
          </button>
        </div>
      </section>

      {error ? <div className="mb-4 rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">{error}</div> : null}
      {successMessage ? <div className="mb-4 rounded-md bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">{successMessage}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Active" value={activeTasks.length} detail="Tasks needing action" />
        <MetricCard label="Completed" value={completedTasks.length} detail="Done or dismissed" />
        <MetricCard label="Total" value={tasks.length} detail="Generated and manual tasks" />
      </div>

      <div className="mt-6 flex gap-2">
        {(["active", "completed", "all"] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold capitalize transition ${statusFilter === filter ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"}`}
          >
            {filter}
          </button>
        ))}
      </div>

      <Section title="Ranked Action List">
        {filtered.length === 0 ? (
          <EmptyState
            title={statusFilter === "completed" ? "Nothing completed yet" : "All clear"}
            copy={statusFilter === "completed" ? "Complete tasks from the inbox to see them here." : "No tasks pending. Enjoy your day."}
          />
        ) : (
          <div className="grid gap-3">
            {filtered.map((task) => (
              <ItemCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </Section>

      {isCreateOpen && (
        <TaskModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          defaultTitle=""
          onConfirm={(title, notes) => void handleCreateTask(title, notes)}
        />
      )}
    </div>
  );
}
