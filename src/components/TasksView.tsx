"use client";

import { ItemCard } from "@/components/ItemCard";
import { Section } from "@/components/Section";
import { generateTasks } from "@/lib/prioritization";
import { usePlosStore } from "@/lib/usePlosStore";

export function TasksView() {
  const { items } = usePlosStore();
  const tasks = generateTasks(items).filter((task) => task.status !== "completed");

  return (
    <div>
      <section className="py-4">
        <h1 className="text-4xl font-black text-stone-950">Tasks</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Generated from the AI Inbox with scoring based on deadline proximity, financial impact, category importance, confidence, and overdue status.
        </p>
      </section>
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
