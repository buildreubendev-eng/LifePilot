"use client";

import { shortcutGroups } from "@/lib/useKeyboardShortcuts";
import { Keyboard, X } from "lucide-react";

export function KeyboardShortcutOverlay({
  isOpen,
  onClose,
  pendingPrefix,
}: {
  isOpen: boolean;
  onClose: () => void;
  pendingPrefix: string | null;
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
        role="button"
        tabIndex={-1}
        aria-label="Close shortcut overlay"
      />

      {/* Panel */}
      <div className="fixed inset-x-4 top-[10%] z-[61] mx-auto max-w-lg animate-scale-in">
        <div className="rounded-2xl border border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Keyboard size={16} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Keyboard Shortcuts</h2>
                <p className="text-[10px] text-stone-500">Press <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono">?</kbd> to toggle</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Pending prefix indicator */}
          {pendingPrefix && (
            <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-3 py-2">
              <span className="text-xs font-bold text-emerald-400">Waiting for second key:</span>
              <kbd className="rounded bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-xs font-mono font-bold text-emerald-300">
                {pendingPrefix.toUpperCase()} → ?
              </kbd>
            </div>
          )}

          {/* Shortcut Groups */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {shortcutGroups.map((group) => (
              <div key={group.title} className="mb-5 last:mb-0">
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                  {group.title}
                </h3>
                <div className="grid gap-1">
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.key}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.03]"
                    >
                      <span className="text-xs text-stone-400">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.label.split(" → ").map((part, i) => (
                          <span key={part}>
                            {i > 0 && <span className="text-stone-600 text-[10px] mx-0.5">then</span>}
                            <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-white/10 bg-white/5 px-1.5 text-[11px] font-mono font-bold text-stone-300">
                              {part}
                            </kbd>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-stone-600">
              Shortcuts are disabled when typing in inputs
            </p>
            <kbd className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] font-mono text-stone-500">
              Esc to close
            </kbd>
          </div>
        </div>
      </div>
    </>
  );
}
