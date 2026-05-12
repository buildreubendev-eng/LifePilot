"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlosStore } from "@/lib/usePlosStore";
import {
  Search,
  LayoutDashboard,
  Inbox,
  CheckSquare,
  Sparkles,
  BookOpen,
  FileText,
  Shield,
  Plug,
  Upload,
  Activity,
  Settings,
  ArrowRight,
  Command,
  CornerDownLeft,
} from "lucide-react";

interface CommandItem {
  id: string;
  type: "navigation" | "item" | "action";
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
}

const navigationCommands: CommandItem[] = [
  { id: "nav-dashboard", type: "navigation", title: "Dashboard", subtitle: "Executive overview", icon: <LayoutDashboard size={16} />, href: "/" },
  { id: "nav-inbox", type: "navigation", title: "AI Inbox", subtitle: "Triage incoming items", icon: <Inbox size={16} />, href: "/inbox" },
  { id: "nav-tasks", type: "navigation", title: "Tasks", subtitle: "Track action items", icon: <CheckSquare size={16} />, href: "/tasks" },
  { id: "nav-suggestions", type: "navigation", title: "Suggestions", subtitle: "AI recommendations", icon: <Sparkles size={16} />, href: "/recommendations" },
  { id: "nav-briefing", type: "navigation", title: "Executive Briefing", subtitle: "Weekly summary", icon: <BookOpen size={16} />, href: "/briefing" },
  { id: "nav-documents", type: "navigation", title: "Documents", subtitle: "Saved records vault", icon: <FileText size={16} />, href: "/documents" },
  { id: "nav-approvals", type: "navigation", title: "Approvals", subtitle: "Review pending actions", icon: <Shield size={16} />, href: "/approvals" },
  { id: "nav-integrations", type: "navigation", title: "Integrations", subtitle: "Connected services", icon: <Plug size={16} />, href: "/integrations" },
  { id: "nav-ingest", type: "navigation", title: "Ingest", subtitle: "Import raw messages", icon: <Upload size={16} />, href: "/ingest" },
  { id: "nav-activity", type: "navigation", title: "Audit Trail", subtitle: "Event history", icon: <Activity size={16} />, href: "/activity" },
  { id: "nav-settings", type: "navigation", title: "Settings", subtitle: "Preferences & config", icon: <Settings size={16} />, href: "/settings" },
];

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { items } = usePlosStore();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build searchable items from inbox
  const inboxCommands: CommandItem[] = useMemo(
    () =>
      items.slice(0, 30).map((item) => ({
        id: `item-${item.id}`,
        type: "item" as const,
        title: item.title,
        subtitle: `${item.sender} · ${item.category}`,
        icon: <Inbox size={16} />,
        href: `/inbox/${item.id}`,
      })),
    [items]
  );

  const allCommands = useMemo(
    () => [...navigationCommands, ...inboxCommands],
    [inboxCommands]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return navigationCommands; // show nav by default
    const q = query.toLowerCase();
    return allCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q))
    );
  }, [query, allCommands]);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keep selected index in bounds
  useEffect(() => {
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, selectedIndex]);

  // Scroll selected into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.querySelector("[data-selected='true']");
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const executeCommand = useCallback(
    (cmd: CommandItem) => {
      onClose();
      if (cmd.href) {
        router.push(cmd.href);
      } else if (cmd.action) {
        cmd.action();
      }
    },
    [onClose, router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filtered[selectedIndex]) {
            executeCommand(filtered[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filtered, selectedIndex, executeCommand, onClose]
  );

  if (!isOpen) return null;

  const groupedResults: { label: string; items: CommandItem[] }[] = [];
  const navItems = filtered.filter((c) => c.type === "navigation");
  const itemResults = filtered.filter((c) => c.type === "item");

  if (navItems.length > 0) groupedResults.push({ label: "Pages", items: navItems });
  if (itemResults.length > 0) groupedResults.push({ label: "Inbox Items", items: itemResults });

  let flatIndex = -1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Close command palette"
      />

      {/* Palette */}
      <div
        className="fixed inset-x-4 top-[12%] z-[81] mx-auto max-w-xl animate-scale-in"
        role="dialog"
        aria-label="Command palette"
      >
        <div className="rounded-2xl border border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-white/5 px-4">
            <Search size={16} className="shrink-0 text-stone-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, inbox items..."
              className="flex-1 bg-transparent py-4 text-sm text-white placeholder:text-stone-500 outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-stone-500">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto custom-scrollbar p-2">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-stone-500">No results for &ldquo;{query}&rdquo;</p>
                <p className="mt-1 text-xs text-stone-600">Try searching for a page name or inbox item</p>
              </div>
            ) : (
              groupedResults.map((group) => (
                <div key={group.label} className="mb-2 last:mb-0">
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-600">
                    {group.label}
                  </p>
                  {group.items.map((cmd) => {
                    flatIndex++;
                    const isSelected = flatIndex === selectedIndex;
                    const currentFlatIndex = flatIndex;
                    return (
                      <button
                        key={cmd.id}
                        type="button"
                        data-selected={isSelected}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          isSelected
                            ? "bg-white/10 text-white"
                            : "text-stone-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className={isSelected ? "text-emerald-400" : "text-stone-500"}>
                          {cmd.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{cmd.title}</p>
                          {cmd.subtitle && (
                            <p className="text-[11px] text-stone-500 truncate">{cmd.subtitle}</p>
                          )}
                        </div>
                        {isSelected && (
                          <span className="shrink-0 flex items-center gap-1 text-stone-500">
                            <CornerDownLeft size={12} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 px-4 py-2.5 flex items-center justify-between text-[10px] text-stone-600">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-white/5 border border-white/10 px-1 py-0.5 font-mono">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-white/5 border border-white/10 px-1 py-0.5 font-mono">⏎</kbd>
                open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-white/5 border border-white/10 px-1 py-0.5 font-mono">esc</kbd>
                close
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Command size={10} />
              <span>K</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
