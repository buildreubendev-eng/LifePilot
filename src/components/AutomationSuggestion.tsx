import { useState } from "react";

export function AutomationSuggestion({ category }: { itemTitle: string; category: string }) {
  const [status, setStatus] = useState<"pending" | "approved" | "declined">("pending");

  if (status === "declined") return null;

  if (status === "approved") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <p className="font-semibold text-emerald-900">Automation Enabled</p>
        </div>
        <p className="mt-1 text-sm text-emerald-800">
          PLOS will automatically save similar {category} documents directly to your vault in the future.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <svg width="18" height="18" className="text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
        <h3 className="font-bold text-indigo-950">Recommended Automation</h3>
      </div>
      <p className="text-sm text-indigo-900 leading-6">
        You frequently save {category} documents like this. Would you like PLOS to automatically save future {category} documents from this sender directly to your Document Vault?
      </p>
      <div className="mt-4 flex gap-3">
        <button onClick={() => setStatus("approved")} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Approve Automation</button>
        <button onClick={() => setStatus("declined")} className="rounded-md bg-white border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">Not Right Now</button>
      </div>
    </div>
  );
}
