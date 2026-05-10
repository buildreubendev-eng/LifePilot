"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import type { ApprovalActionType, ApprovalRequest } from "@/lib/types";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  CreditCard,
  Ban,
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const actionTypes: ApprovalActionType[] = ["send_message", "make_payment", "cancel_subscription"];

const actionTypeConfig: Record<ApprovalActionType, { label: string; icon: React.ReactNode; color: string }> = {
  send_message: {
    label: "Send Message",
    icon: <Send size={14} />,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  make_payment: {
    label: "Make Payment",
    icon: <CreditCard size={14} />,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  cancel_subscription: {
    label: "Cancel Subscription",
    icon: <Ban size={14} />,
    color: "text-red-400 bg-red-500/10 border-red-500/20",
  },
};

const riskConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  low: {
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    icon: <ShieldCheck size={12} />,
    label: "Low Risk",
  },
  medium: {
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    icon: <ShieldAlert size={12} />,
    label: "Medium Risk",
  },
  high: {
    color: "text-red-400 bg-red-500/10 border-red-500/20",
    icon: <ShieldX size={12} />,
    label: "High Risk",
  },
};

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  pending: { color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: <Clock size={12} /> },
  approved: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: <CheckCircle2 size={12} /> },
  rejected: { color: "text-red-400 bg-red-500/10 border-red-500/20", icon: <XCircle size={12} /> },
};

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
  const [showCreateForm, setShowCreateForm] = useState(false);

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
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load approvals");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void init();
    return () => { active = false; };
  }, [loadApprovals]);

  async function createApproval() {
    if (!title.trim()) { setError("Title is required."); return; }
    setIsCreating(true);
    try {
      await fetchJson<{ approval: ApprovalRequest }>("/api/life-admin/approvals", {
        method: "POST",
        body: JSON.stringify({ actionType, title, description }),
      });
      await loadApprovals();
      setError(null);
      setSuccessMessage("Approval request created.");
      setShowCreateForm(false);
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

  const pending = approvals.filter((a) => a.status === "pending");
  const approved = approvals.filter((a) => a.status === "approved");
  const rejected = approvals.filter((a) => a.status === "rejected");

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-emerald-500" />
          <p className="tracking-widest uppercase text-stone-500 text-sm font-semibold">Loading Approvals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20">
      <section className="py-4 mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Approvals</h1>
            <p className="mt-3 max-w-3xl text-lg font-light leading-7 text-stone-400">
              Sensitive actions are staged here. Messages, payments, and cancellations always require your explicit approval.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 shrink-0 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-500 hover:-translate-y-0.5 transition-all"
          >
            <Plus size={16} />
            New Request
          </button>
        </div>
      </section>

      {/* Trust framework banner */}
      <div className="mb-8 rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <Shield size={20} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Approval-First Security Model</h3>
            <p className="mt-1 text-xs text-stone-400 leading-relaxed max-w-2xl">
              PLOS operates on an approval-first basis for all sensitive actions. No message is sent, no payment is made, and no subscription is cancelled without your explicit review and approval. Low-risk actions like document saves and task creation can proceed automatically.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["low", "medium", "high"] as const).map((level) => {
                const config = riskConfig[level];
                return (
                  <span key={level} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${config.color}`}>
                    {config.icon}
                    {config.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {error ? <div className="mb-6 rounded-lg bg-red-950/50 border border-red-500/30 px-4 py-3 text-sm font-medium text-red-200">{error}</div> : null}
      {successMessage ? <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm font-medium text-emerald-200">{successMessage}</div> : null}

      <div className="grid gap-5 md:grid-cols-3 mb-10">
        <MetricCard label="Pending" value={pending.length} detail="Waiting for your review" icon={<Clock size={20} />} trend="warning" />
        <MetricCard label="Approved" value={approved.length} detail="Reviewed and allowed" icon={<CheckCircle2 size={20} />} trend="success" />
        <MetricCard label="Rejected" value={rejected.length} detail="Stopped by you" icon={<XCircle size={20} />} trend="danger" />
      </div>

      {/* Collapsible Create Form */}
      {showCreateForm && (
        <Section title="Create Approval Request">
          <div className="rounded-2xl border border-white/5 bg-black/40 p-6 shadow-lg backdrop-blur-md animate-fade-in">
            <div className="grid gap-4 md:grid-cols-[0.8fr_1fr_1.3fr_auto] md:items-end">
              <label className="grid gap-2 text-xs font-bold uppercase tracking-widest text-stone-500">
                Action Type
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as ApprovalActionType)}
                  className="rounded-xl border border-white/10 bg-black/60 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                >
                  {actionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-xs font-bold uppercase tracking-widest text-stone-500">
                Title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/60 px-3 py-3 text-sm text-white outline-none placeholder:text-stone-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                />
              </label>
              <label className="grid gap-2 text-xs font-bold uppercase tracking-widest text-stone-500">
                Description
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/60 px-3 py-3 text-sm text-white outline-none placeholder:text-stone-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                />
              </label>
              <button
                type="button"
                onClick={() => void createApproval()}
                disabled={isCreating}
                className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-500 disabled:opacity-50"
              >
                {isCreating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </Section>
      )}

      {/* Review Queue */}
      <Section title={`Review Queue (${approvals.length})`}>
        {approvals.length === 0 ? (
          <EmptyState
            title="No approval requests"
            copy="Create a request above or process inbox items that generate sensitive recommendations. All high-risk actions will appear here for your review."
            icon="approvals"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {approvals.map((approval) => {
              const risk = riskConfig[approval.riskLevel] ?? riskConfig.low;
              const status = statusConfig[approval.status] ?? statusConfig.pending;
              const actionConfig = actionTypeConfig[approval.actionType];
              const isPending = approval.status === "pending";

              return (
                <div
                  key={approval.id}
                  className={`rounded-2xl border p-5 shadow-lg backdrop-blur-md transition-all ${
                    approval.status === "approved"
                      ? "bg-emerald-950/10 border-emerald-500/20"
                      : approval.status === "rejected"
                        ? "bg-red-950/10 border-red-500/20"
                        : "bg-black/40 border-white/5 hover:border-white/20 hover:bg-black/60"
                  }`}
                >
                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {actionConfig && (
                      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${actionConfig.color}`}>
                        {actionConfig.icon}
                        {actionConfig.label}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${risk.color}`}>
                      {risk.icon}
                      {risk.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold capitalize ${status.color}`}>
                      {status.icon}
                      {approval.status}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className={`text-base font-bold leading-snug ${approval.status !== "pending" ? "text-stone-400" : "text-white"}`}>
                    {approval.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-400">{approval.description}</p>

                  {/* Metadata */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
                    <span>Created {new Date(approval.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    {approval.reviewedAt && (
                      <>
                        <span className="text-white/10">•</span>
                        <span>
                          {approval.status === "approved" ? "Approved" : "Rejected"}{" "}
                          {new Date(approval.reviewedAt).toLocaleDateString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </>
                    )}
                    {approval.reviewerNote && (
                      <>
                        <span className="text-white/10">•</span>
                        <span className="italic">&ldquo;{approval.reviewerNote}&rdquo;</span>
                      </>
                    )}
                  </div>

                  {/* Trust warning for high-risk */}
                  {isPending && approval.riskLevel === "high" && (
                    <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5 flex items-start gap-2">
                      <AlertTriangle size={12} className="shrink-0 mt-0.5 text-red-400" />
                      <p className="text-[10px] text-red-400/80 leading-tight">
                        This is a high-risk action. Review carefully before approving. This action cannot be undone.
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  {isPending && (
                    <div className="mt-4 pt-3 border-t border-white/5 flex gap-3">
                      <button
                        type="button"
                        onClick={() => void reviewApproval(approval.id, "approved")}
                        disabled={reviewingId !== null}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-500 hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        {reviewingId === approval.id ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => void reviewApproval(approval.id, "rejected")}
                        disabled={reviewingId !== null}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-stone-400 transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
