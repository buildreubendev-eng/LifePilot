"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface ShortcutGroup {
  title: string;
  shortcuts: { key: string; label: string; description: string }[];
}

export const shortcutGroups: ShortcutGroup[] = [
  {
    title: "Navigation",
    shortcuts: [
      { key: "g d", label: "G → D", description: "Go to Dashboard" },
      { key: "g i", label: "G → I", description: "Go to AI Inbox" },
      { key: "g t", label: "G → T", description: "Go to Tasks" },
      { key: "g s", label: "G → S", description: "Go to Suggestions" },
      { key: "g b", label: "G → B", description: "Go to Briefing" },
      { key: "g o", label: "G → O", description: "Go to Documents" },
      { key: "g a", label: "G → A", description: "Go to Approvals" },
      { key: "g n", label: "G → N", description: "Go to Integrations" },
      { key: "g e", label: "G → E", description: "Go to Settings" },
    ],
  },
  {
    title: "Quick Actions",
    shortcuts: [
      { key: "?", label: "?", description: "Toggle shortcut overlay" },
      { key: "Escape", label: "Esc", description: "Close overlay / Deselect" },
      { key: "/", label: "/", description: "Focus search (when available)" },
    ],
  },
];

const navigationMap: Record<string, string> = {
  d: "/",
  i: "/inbox",
  t: "/tasks",
  s: "/recommendations",
  b: "/briefing",
  o: "/documents",
  a: "/approvals",
  n: "/integrations",
  e: "/settings",
};

export function useKeyboardShortcuts() {
  const router = useRouter();
  const [showOverlay, setShowOverlay] = useState(false);
  const [pendingPrefix, setPendingPrefix] = useState<string | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't capture when typing in inputs/textareas/selects
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // Escape closes overlay
      if (e.key === "Escape") {
        setShowOverlay(false);
        setPendingPrefix(null);
        return;
      }

      // ? toggles overlay
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowOverlay((prev) => !prev);
        return;
      }

      // / focuses search
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="earch"]'
        );
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
          return;
        }
      }

      // G prefix navigation
      if (pendingPrefix === "g") {
        const destination = navigationMap[e.key.toLowerCase()];
        if (destination) {
          e.preventDefault();
          router.push(destination);
          setShowOverlay(false);
        }
        setPendingPrefix(null);
        return;
      }

      if (e.key.toLowerCase() === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setPendingPrefix("g");
        // Auto-clear after 1.5s if no second key
        setTimeout(() => setPendingPrefix((current) => (current === "g" ? null : current)), 1500);
        return;
      }
    },
    [pendingPrefix, router]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    showOverlay,
    setShowOverlay,
    pendingPrefix,
  };
}
