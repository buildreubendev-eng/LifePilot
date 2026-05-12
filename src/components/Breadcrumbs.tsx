"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { usePlosStore } from "@/lib/usePlosStore";

/** Human-readable labels for each route segment */
const routeLabels: Record<string, string> = {
  "": "Dashboard",
  inbox: "AI Inbox",
  tasks: "Tasks",
  recommendations: "Suggestions",
  briefing: "Executive Briefing",
  documents: "Documents",
  approvals: "Approvals",
  integrations: "Integrations",
  ingest: "Ingest",
  activity: "Audit Trail",
  settings: "Settings",
};

interface Crumb {
  label: string;
  href: string;
  isLast: boolean;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const { items } = usePlosStore();

  // Don't render on Dashboard (root)
  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [
    { label: "Dashboard", href: "/", isLast: false },
  ];

  let href = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    href += `/${segment}`;
    const isLast = i === segments.length - 1;

    // Check if this is a dynamic segment (inbox item detail)
    if (i > 0 && segments[i - 1] === "inbox" && segment !== "inbox") {
      // Resolve inbox item title
      const item = items.find((m) => m.id === segment);
      const label = item?.title
        ? item.title.length > 40
          ? `${item.title.slice(0, 40)}…`
          : item.title
        : `Item ${segment.slice(0, 8)}`;
      crumbs.push({ label, href, isLast });
    } else {
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      crumbs.push({ label, href, isLast });
    }
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 flex-wrap text-xs">
        {crumbs.map((crumb, i) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight
                size={12}
                className="text-stone-600 shrink-0"
                aria-hidden="true"
              />
            )}
            {crumb.isLast ? (
              <span
                className="font-semibold text-stone-300 truncate max-w-[200px] sm:max-w-[300px]"
                aria-current="page"
              >
                {i === 0 && <Home size={12} className="inline mr-1 -mt-0.5" aria-hidden="true" />}
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="font-medium text-stone-500 transition-colors hover:text-stone-300 truncate max-w-[160px] sm:max-w-[200px]"
              >
                {i === 0 && <Home size={12} className="inline mr-1 -mt-0.5" aria-hidden="true" />}
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
