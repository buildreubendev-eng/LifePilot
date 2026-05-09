"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadApprovals = useCallback(async () => {
    const body = await fetchJson<{ approvals: ApprovalRequest[] }>("/api/life-admin/approvals");
    setApprovals(body.approvals);
  }, []);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        await loadApprovals();
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load approvals");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void init();
    return () => {
      active = false;
    };
  }, [loadApprovals]);

  async function createApproval() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setIsCreating(true);
    try {
      await fetchJson<{ approval: ApprovalRequest }>("/api/life-admin/approvals", {
        method: "POST",
        body: JSON.stringify({ actionType, title, description }),
      });
      await loadApprovals();
      setError(null);
      setSuccessMessage("Approval request created.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create approval");
    } finally {
      setIsCreating(false);
    }
  }

  async function reviewApproval(id: string, status: "approved" | "rejected") {
    setReviewingId(id);
    try {
      await fetchJson<{ approval: ApprovalRequest }>(`/api/life-admin/approvals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadApprovals();
      setError(null);
      setSuccessMessage(`Request ${status}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to review approval");
    } finally {
      setReviewingId(null);
    }
  }

  const pending = approvals.filter((approval) => approval.status === "pending");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-stone-900" />
          <p className="mt-4 text-sm font-semibold text-stone-400">Loading approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="py-4">
        <h1 className="text-4xl font-black text-white">Approvals</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-400">
          Sensitive actions are staged here. PLOS can recommend next steps, but messages, payments, and cancellations require explicit approval.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Pending" value={pending.length} detail="Waiting for user review" />
        <MetricCard label="Approved" value={approvals.filter((approval) => approval.status === "approved").length} detail="Reviewed and allowed" />
        <MetricCard label="Rejected" value={approvals.filter((approval) => approval.status === "rejected").length} detail="Stopped by the user" />
      </div>

      {successMessage ? <div className="mt-4 rounded-md bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">{successMessage}</div> : null}
      {error ? <div className="mt-4 rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">{error}</div> : null}

      <Section title="Create Approval Request">
        <div className="rounded-lg border border-white/10 bg-black/40 p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[0.8fr_1fr_1.3fr_auto] md:items-end">
            <label className="grid gap-2 text-sm font-semibold text-stone-300">
              Action
              <select value={actionType} onChange={(event) => setActionType(event.target.value as ApprovalActionType)} className="rounded-md border border-stone-300 bg-black/40 px-3 py-2">
                {actionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-300">
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-md border border-stone-300 px-3 py-2" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-300">
              Description
              <input value={description} onChange={(event) => setDescription(event.target.value)} className="rounded-md border border-stone-300 px-3 py-2" />
            </label>
            <button
              type="button"
              onClick={() => void createApproval()}
              disabled={isCreating}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </Section>

      <Section title="Review Queue">
        {approvals.length === 0 ? (
          <EmptyState title="No approval requests" copy="Create a request above or wire future recommended actions into this approval queue." icon="approvals" />
        ) : (
          <div className="grid gap-3">
            {approvals.map((approval) => (
              <div key={approval.id} className={`rounded-lg border p-4 shadow-sm ${
                approval.status === "approved" ? "border-emerald-200 bg-emerald-50/30" :
                approval.status === "rejected" ? "border-red-200 bg-red-50/30" :
                "border-white/10 bg-black/40"
              }`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold capitalize text-stone-300">{approval.actionType.replaceAll("_", " ")}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        approval.riskLevel === "high" ? "bg-red-100 text-red-800" :
                        approval.riskLevel === "medium" ? "bg-amber-100 text-amber-800" :
                        "bg-emerald-100 text-emerald-800"
                      }`}>{approval.riskLevel} risk</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        approval.status === "approved" ? "bg-emerald-100 text-emerald-800" :
                        approval.status === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>{approval.status}</span>
                    </div>
                    <h3 className="mt-3 text-base font-bold text-white">{approval.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-stone-400">{approval.description}</p>
                    {approval.reviewedAt && (
                      <p className="mt-1 text-xs text-stone-400">
                        Reviewed: {new Date(approval.reviewedAt).toLocaleString()}
                        {approval.reviewerNote ? ` — "${approval.reviewerNote}"` : ""}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-stone-400">Created: {new Date(approval.createdAt).toLocaleString()}</p>
                  </div>
                  {approval.status === "pending" ? (
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void reviewApproval(approval.id, "approved")}
                        disabled={reviewingId !== null}
                        className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {reviewingId === approval.id ? "..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void reviewApproval(approval.id, "rejected")}
                        disabled={reviewingId !== null}
                        className="rounded-md bg-black/40 px-3 py-2 text-sm font-semibold text-stone-300 ring-1 border border-white/10 hover:bg-black/20 disabled:opacity-50"
                      >
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
