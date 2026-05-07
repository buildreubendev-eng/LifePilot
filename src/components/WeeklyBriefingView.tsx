"use client";

import { useEffect, useState } from "react";
import { ItemCard } from "@/components/ItemCard";
import { Section } from "@/components/Section";
import { ConflictAlert } from "@/components/ConflictAlert";
import { EmptyState } from "@/components/EmptyState";
import { fetchJson } from "@/lib/apiClient";
import type { BriefingSummary } from "@/lib/types";

export function WeeklyBriefingView() {
  const [briefing, setBriefing] = useState<BriefingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadBriefing() {
      try {
        const body = await fetchJson<{ briefing: BriefingSummary }>("/api/life-admin/briefing");
        if (active) {
          setBriefing(body.briefing);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load briefing");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadBriefing();
    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900" />
          <p className="mt-4 text-sm font-semibold text-stone-600">Generating your weekly briefing...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <section className="py-4">
          <h1 className="text-4xl font-black text-stone-950">Weekly Briefing</h1>
        </section>
        <div className="rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">{error}</div>
      </div>
    );
  }

  if (!briefing) {
    return null;
  }

  return (
    <div>
      <section className="py-4">
        <h1 className="text-4xl font-black text-stone-950">Weekly Briefing</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          A calm summary of what needs attention, what can wait, and where PLOS recommends action.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {briefing.recommendedActions.map((action) => (
          <div key={action} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-stone-950">{action}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Needs Attention This Week">
          <div className="grid gap-3">
            {briefing.attentionThisWeek.length === 0 ? (
              <EmptyState title="Nothing urgent" copy="Your week looks manageable." />
            ) : (
              briefing.attentionThisWeek.slice(0, 6).map((task) => (
                <ItemCard key={task.id} task={task} />
              ))
            )}
          </div>
        </Section>
        <Section title="Overdue Items">
          <div className="grid gap-3">
            {briefing.overdueItems.length === 0 ? (
              <EmptyState title="Nothing overdue" copy="No overdue items right now." />
            ) : (
              briefing.overdueItems.map((task) => <ItemCard key={task.id} task={task} />)
            )}
          </div>
        </Section>
        <Section title="Upcoming Bills">
          <div className="grid gap-3">
            {briefing.upcomingBills.length === 0 ? (
              <EmptyState title="No upcoming bills" copy="No bills due soon." />
            ) : (
              briefing.upcomingBills.slice(0, 5).map((task) => (
                <ItemCard key={task.id} task={task} />
              ))
            )}
          </div>
        </Section>
        <Section title="Subscriptions Renewing Soon">
          <div className="grid gap-3">
            {briefing.renewingSubscriptions.length === 0 ? (
              <EmptyState title="No renewals" copy="No subscriptions are renewing soon." />
            ) : (
              briefing.renewingSubscriptions.map((task) => (
                <ItemCard key={task.id} task={task} />
              ))
            )}
          </div>
        </Section>
      </div>

      <Section title="Schedule Conflicts">
        {briefing.scheduleConflicts.length === 0 ? (
          <EmptyState title="Schedule clear" copy="Your schedule is clear of conflicts." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {briefing.scheduleConflicts.map((conflict) => (
              <ConflictAlert key={conflict.map((item) => item.id).join("-")} conflict={conflict} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Documents That Should Be Saved">
        {briefing.documentsToSave.length === 0 ? (
          <EmptyState title="All documents saved" copy="No documents need saving right now." />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {briefing.documentsToSave.slice(0, 6).map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
