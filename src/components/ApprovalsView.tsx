"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import type { ApprovalActionType, ApprovalRequest } from "@/lib/types";

const actionTypes: ApprovalActionType[] = ["send_message", "make_payment", "cancel_subscription"];

export function ApprovalsView() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [actionType, setActionType] = useState<ApprovalActionType>("send_message");
  const [title, setTitle] = useState("Reply to provider");
  const [description, setDescription] = useState("Draft response requires approval before sending.");
  const [error, setError] = useState<string | null>(null);

  async function loadApprovals() {
    const body = await fetchJson<{ approvals: ApprovalRequest[] }>("/api/life-admin/approvals");
    setApprovals(body.approvals);
  }

  useEffect(() => {
    let active = true;

    async function loadInitialApprovals() {
      try {
        const body = await fetchJson<{ approvals: ApprovalRequest[] }>("/api/life-admin/approvals");
        if (active) {
          setApprovals(body.approvals);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load approvals");
        }
      }
    }

    void loadInitialApprovals();
    return () => {
      active = false;
    };
  }, []);

  async function createApproval() {
    try {
      await fetchJson<{ approval: ApprovalRequest }>("/api/life-admin/approvals", {
        method: "POST",
        body: JSON.stringify({ actionType, title, description }),
      });
      await loadApprovals();
      setError(null);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create approval");
    }
  }

  async function reviewApproval(id: string, status: "approved" | "rejected") {
    try {
      await fetchJson<{ approval: ApprovalRequest }>(`/api/life-admin/approvals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadApprovals();
      setError(null);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to review approval");
    }
  }

  const pending = approvals.filter((approval) => approval.status === "pending");

  return (
    <div>
      <section className="py-4">
        <h1 className="text-4xl font-black text-stone-950">Approvals</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Sensitive actions are staged here. PLOS can recommend next steps, but messages, payments, and cancellations require explicit approval.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Pending" value={pending.length} detail="Waiting for user review" />
        <MetricCard label="Approved" value={approvals.filter((approval) => approval.status === "approved").length} detail="Reviewed and allowed" />
        <MetricCard label="Rejected" value={approvals.filter((approval) => approval.status === "rejected").length} detail="Stopped by the user" />
      </div>

      <Section title="Create Approval Request">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[0.8fr_1fr_1.3fr_auto] md:items-end">
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              Action
              <select value={actionType} onChange={(event) => setActionType(event.target.value as ApprovalActionType)} className="rounded-md border border-stone-300 bg-white px-3 py-2">
                {actionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-md border border-stone-300 px-3 py-2" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              Description
              <input value={description} onChange={(event) => setDescription(event.target.value)} className="rounded-md border border-stone-300 px-3 py-2" />
            </label>
            <button type="button" onClick={() => void createApproval()} className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white">
              Create
            </button>
          </div>
          {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
        </div>
      </Section>

      <Section title="Review Queue">
        {approvals.length === 0 ? (
          <EmptyState title="No approval requests" copy="Create a request above or wire future recommended actions into this approval queue." />
        ) : (
          <div className="grid gap-3">
            {approvals.map((approval) => (
              <div key={approval.id} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold capitalize text-stone-700">{approval.actionType.replaceAll("_", " ")}</span>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold capitalize text-amber-800">{approval.riskLevel} risk</span>
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold capitalize text-blue-800">{approval.status}</span>
                    </div>
                    <h3 className="mt-3 text-base font-bold text-stone-950">{approval.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{approval.description}</p>
                  </div>
                  {approval.status === "pending" ? (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => void reviewApproval(approval.id, "approved")} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">
                        Approve
                      </button>
                      <button type="button" onClick={() => void reviewApproval(approval.id, "rejected")} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-stone-700 ring-1 ring-stone-200">
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
