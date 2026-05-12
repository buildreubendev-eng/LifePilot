"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BackendStatusPill } from "@/components/BackendStatusPill";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcutOverlay } from "@/components/KeyboardShortcutOverlay";
import { ToastProvider } from "@/components/ToastProvider";
import { useKeyboardShortcuts } from "@/lib/useKeyboardShortcuts";
import { Shield, Keyboard, Search } from 'lucide-react';

const navigation = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    section: "core",
  },
  {
    href: "/inbox",
    label: "AI Inbox",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-6l-2 3H10l-2-3H2" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    ),
    section: "core",
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    section: "core",
  },
  {
    href: "/recommendations",
    label: "Suggestions",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
    section: "core",
  },
  {
    href: "/briefing",
    label: "Weekly Briefing",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    section: "review",
  },
  {
    href: "/documents",
    label: "Documents",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14,2 14,8 20,8" />
      </svg>
    ),
    section: "review",
  },
  {
    href: "/approvals",
    label: "Approvals",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    section: "review",
  },
  {
    href: "/integrations",
    label: "Integrations",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    section: "system",
  },
  {
    href: "/ingest",
    label: "Ingest",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7,10 12,15 17,10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    section: "system",
  },
  {
    href: "/activity",
    label: "Activity",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
      </svg>
    ),
    section: "system",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    section: "system",
  },
];

const mobileNavItems = navigation.filter((item) =>
  ["/", "/inbox", "/tasks", "/briefing", "/settings"].includes(item.href),
);

const sectionLabels: Record<string, string> = {
  core: "Life Admin",
  review: "Review",
  system: "System",
};

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { showOverlay, setShowOverlay, showCommandPalette, setShowCommandPalette, pendingPrefix } = useKeyboardShortcuts();

  const sections = [...new Set(navigation.map((n) => n.section))];

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Background ambient light */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/10 blur-[100px]" />
      </div>

      {/* Skip to content (accessibility) */}
      <a href="#main-content" className="skip-to-content relative z-50">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-white/10 bg-black/80 backdrop-blur-xl lg:flex"
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30">
            <Shield size={18} className="text-emerald-400" />
          </div>
          <div>
            <Link href="/" className="text-lg font-black text-white tracking-tight">
              PLOS
            </Link>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 opacity-80">
              Executive
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4">
          {sections.map((section) => (
            <div key={section} className="mb-5">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                {sectionLabels[section]}
              </p>
              <div className="grid gap-0.5">
                {navigation
                  .filter((item) => item.section === section)
                  .map((item) => {
                    const active =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                          active
                            ? "bg-white/10 text-white shadow-sm border border-white/5"
                            : "text-stone-400 hover:bg-white/5 hover:text-white border border-transparent"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`shrink-0 transition-colors ${
                            active ? "text-emerald-400" : "text-stone-500 group-hover:text-stone-300"
                          }`}
                        >
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/5 px-4 py-3">
          <BackendStatusPill />
          <button
            type="button"
            onClick={() => setShowCommandPalette(true)}
            className="mt-2 flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-[10px] text-stone-500 transition-colors hover:bg-white/[0.04] hover:text-stone-400"
          >
            <span className="flex items-center gap-1.5">
              <Search size={12} />
              Search...
            </span>
            <kbd className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 font-mono text-[9px]">⌘K</kbd>
          </button>
          <button
            type="button"
            onClick={() => setShowOverlay(true)}
            className="mt-1.5 flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-[10px] text-stone-500 transition-colors hover:bg-white/[0.04] hover:text-stone-400"
          >
            <span className="flex items-center gap-1.5">
              <Keyboard size={12} />
              Shortcuts
            </span>
            <kbd className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 font-mono text-[9px]">?</kbd>
          </button>
          <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-950/30 px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Mock Data Demo
            </p>
            <p className="mt-0.5 text-[10px] text-emerald-500/80">
              Executive Preview
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2" aria-label="PLOS Dashboard home">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30">
              <Shield size={16} className="text-emerald-400" />
            </div>
            <span className="text-lg font-black text-white">PLOS</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-stone-400 hover:bg-white/10 hover:text-white transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="absolute inset-x-0 top-14 max-h-[70vh] overflow-y-auto border-b border-white/10 bg-black/95 shadow-2xl animate-scale-in backdrop-blur-xl">
            <nav className="px-3 py-3">
              {sections.map((section) => (
                <div key={section} className="mb-3">
                  <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    {sectionLabels[section]}
                  </p>
                  {navigation
                    .filter((item) => item.section === section)
                    .map((item) => {
                      const active =
                        pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                            active
                              ? "bg-white/10 text-white"
                              : "text-stone-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span className={active ? "text-emerald-400" : "text-stone-500"}>
                            {item.icon}
                          </span>
                          {item.label}
                        </Link>
                      );
                    })}
                </div>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/80 backdrop-blur-xl lg:hidden"
        aria-label="Quick navigation"
      >
        <div className="mx-auto flex max-w-md items-center justify-around px-1 py-2 safe-bottom">
          {mobileNavItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 min-h-[44px] min-w-[44px] text-[10px] font-semibold transition ${
                  active ? "text-white" : "text-stone-500"
                }`}
              >
                <span className={active ? "text-emerald-400" : ""} aria-hidden="true">{item.icon}</span>
                {item.label === "Weekly Briefing" ? "Briefing" : item.label}
                {active && (
                  <span className="h-1 w-4 rounded-full bg-emerald-500" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main content area */}
      <main
        id="main-content"
        className="min-h-screen pt-14 pb-20 lg:pt-0 lg:pb-0 lg:pl-[260px] relative z-10"
      >
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 animate-fade-in">
          <ToastProvider>
            {children}
          </ToastProvider>
        </div>
      </main>

      {/* Command palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />

      {/* Keyboard shortcut overlay */}
      <KeyboardShortcutOverlay
        isOpen={showOverlay}
        onClose={() => setShowOverlay(false)}
        pendingPrefix={pendingPrefix}
      />

      {/* Pending prefix indicator (floating) */}
      {pendingPrefix && !showOverlay && !showCommandPalette && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 lg:bottom-6 animate-scale-in">
          <div className="rounded-full border border-emerald-500/30 bg-black/90 backdrop-blur-xl px-4 py-2 shadow-2xl flex items-center gap-2">
            <kbd className="rounded bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-xs font-mono font-bold text-emerald-300">
              {pendingPrefix.toUpperCase()}
            </kbd>
            <span className="text-xs text-stone-400">waiting for second key...</span>
          </div>
        </div>
      )}
    </div>
  );
}
