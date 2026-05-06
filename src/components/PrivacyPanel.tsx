import { Badge } from "@/components/Badge";

export function PrivacyPanel() {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="privacy">Privacy first</Badge>
        <h2 className="text-lg font-bold text-stone-950">Your data stays under your control</h2>
      </div>
      <div className="mt-4 grid gap-3 text-sm leading-6 text-stone-700 md:grid-cols-2">
        <p>User data is private, and integrations are permission-based.</p>
        <p>Sensitive categories like medical, financial, and family items can be disabled.</p>
        <p>PLOS requires explicit approval before sending messages or changing accounts.</p>
        <p>No payment, cancellation, or subscription action runs automatically in this MVP.</p>
      </div>
    </div>
  );
}
