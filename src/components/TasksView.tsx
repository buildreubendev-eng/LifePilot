"use client";

import { useCallback, useEffect, useState } from "react";
import { ItemCard } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { Section } from "@/components/Section";
import { TaskModal } from "@/components/TaskModal";
import { fetchJson } from "@/lib/apiClient";
import type { LifeAdminTask, ManualTask } from "@/lib/types";
import { Plus, ListTodo, CheckSquare, Layers } from 'lucide-react';

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
      <div className="flex min-h-[60vh] items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-emerald-500" />
          <p className="tracking-widest uppercase text-stone-500 text-sm font-semibold">Loading Tasks</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20">
      <section className="py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Tasks</h1>
            <p className="mt-3 max-w-3xl text-lg font-light leading-7 text-stone-400">
              Generated from the AI Inbox with dynamic scoring based on deadlines, financial impact, and priority.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 shrink-0 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-500 hover:-translate-y-0.5 transition-all"
          >
            <Plus size={16} />
            Create Task
          </button>
        </div>
      </section>

      {error ? <div className="mb-6 rounded-lg bg-red-950/50 border border-red-500/30 px-4 py-3 text-sm font-medium text-red-200">{error}</div> : null}
      {successMessage ? <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm font-medium text-emerald-200">{successMessage}</div> : null}

      <div className="grid gap-5 md:grid-cols-3 mb-10">
        <MetricCard label="Active" value={activeTasks.length} detail="Tasks needing action" icon={<ListTodo size={20} />} trend="warning" />
        <MetricCard label="Completed" value={completedTasks.length} detail="Done or dismissed" icon={<CheckSquare size={20} />} trend="success" />
        <MetricCard label="Total" value={tasks.length} detail="Generated and manual tasks" icon={<Layers size={20} />} />
      </div>

      <div className="mb-8 flex gap-3 p-1 bg-black/40 border border-white/5 rounded-xl w-fit backdrop-blur-xl">
        {(["active", "completed", "all"] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`rounded-lg px-4 py-2 text-sm font-bold capitalize transition-all ${statusFilter === filter ? "bg-white/10 text-white shadow-lg border border-white/10" : "text-stone-400 hover:text-white hover:bg-white/5"}`}
          >
            {filter}
          </button>
        ))}
      </div>

      <Section title="Ranked Action List">
        {filtered.length === 0 ? (
          <EmptyState
            title={statusFilter === "completed" ? "Nothing completed yet" : "All clear"}
            copy={statusFilter === "completed" ? "Complete tasks from the inbox to see them here." : "No tasks pending. Operations optimal."}
            icon={statusFilter === "completed" ? "tasks" : "success"}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 stagger-children">
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
