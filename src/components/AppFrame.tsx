"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/", label: "Dashboard" },
  { href: "/inbox", label: "AI Inbox" },
  { href: "/tasks", label: "Tasks" },
  { href: "/briefing", label: "Weekly Briefing" },
  { href: "/documents", label: "Documents" },
  { href: "/settings", label: "Settings" },
];

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="text-2xl font-black text-stone-950">
              PLOS
            </Link>
            <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
              Mock integrations only
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {navigation.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition ${
                    active ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
