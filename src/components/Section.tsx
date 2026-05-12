"use client";

import { useId, useState } from "react";

export function Section({
  title,
  action,
  icon,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const headingId = useId();

  return (
    <section className="py-6" aria-labelledby={headingId}>
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-stone-400 transition hover:bg-white/10 hover:text-white border border-white/5"
              aria-label={isOpen ? `Collapse ${title}` : `Expand ${title}`}
              aria-expanded={isOpen}
              aria-controls={`${headingId}-content`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                aria-hidden="true"
              >
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </button>
          )}
          {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
          <h2 id={headingId} className="text-xl font-extrabold text-white tracking-tight">{title}</h2>
        </div>
        {action}
      </div>
      {(!collapsible || isOpen) && (
        <div id={`${headingId}-content`} className={collapsible ? "animate-slide-up" : ""}>{children}</div>
      )}
    </section>
  );
}
