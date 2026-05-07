import type { LifeAdminMessage } from "@/lib/types";

export function ConflictAlert({ conflict }: { conflict: LifeAdminMessage[] }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
        <p className="font-semibold text-amber-950">Schedule Conflict</p>
      </div>
      <div className="mt-3 grid gap-2">
        {conflict.map((item, idx) => (
          <div key={item.id} className="flex flex-wrap items-center gap-2 text-sm text-amber-900">
            <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800">{idx + 1}</span>
            <span className="font-medium">{item.title}</span>
            <span className="opacity-75 block w-full pl-7 sm:w-auto sm:pl-0 sm:inline">({new Date(item.appointmentStart!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
