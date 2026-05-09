"use client";

import { useState } from "react";

export function Section({
  title,
  action,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="py-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              aria-label={isOpen ? "Collapse section" : "Expand section"}
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
              >
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </button>
          )}
          <h2 className="text-xl font-bold text-stone-950">{title}</h2>
        </div>
        {action}
      </div>
      {(!collapsible || isOpen) && (
        <div className={collapsible ? "animate-slide-up" : ""}>{children}</div>
      )}
    </section>
  );
}
