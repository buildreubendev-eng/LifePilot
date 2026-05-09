import { Badge } from "@/components/Badge";

const privacyPoints = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    text: "User data is private, and integrations are permission-based.",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    text: "Sensitive categories like medical, financial, and family items can be disabled.",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    text: "PLOS requires explicit approval before sending messages or changing accounts.",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
    text: "No payment, cancellation, or subscription action runs automatically in this MVP.",
  },
];

export function PrivacyPanel() {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-50/40 p-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <Badge variant="privacy">Privacy first</Badge>
        <h2 className="text-lg font-bold text-white">Your data stays under your control</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {privacyPoints.map((point) => (
          <div key={point.text} className="flex items-start gap-3 rounded-xl bg-black/40/60 p-3">
            <span className="mt-0.5 shrink-0 text-emerald-600">{point.icon}</span>
            <p className="text-sm leading-6 text-stone-300">{point.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
