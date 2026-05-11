"use client";

/**
 * Skeleton loading components with shimmer animation.
 * Replaces spinner-based loading states with content-shaped placeholders.
 */

function SkeletonPulse({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-gradient-to-r from-white/[0.03] via-white/[0.08] via-white/[0.03] to-white/[0.03] bg-[length:400%_100%] ${className}`}
      style={{ animation: "shimmer 1.8s ease-in-out infinite" }}
    />
  );
}

/** Single metric card skeleton */
export function SkeletonMetricCard() {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <SkeletonPulse className="h-9 w-9 rounded-lg" />
      </div>
      <SkeletonPulse className="h-8 w-16 mb-2" />
      <SkeletonPulse className="h-3 w-24" />
    </div>
  );
}

/** Row of metric cards */
export function SkeletonMetrics({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid gap-4 grid-cols-2 lg:grid-cols-${count} mb-10`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMetricCard key={i} />
      ))}
    </div>
  );
}

/** Single item card skeleton */
export function SkeletonItemCard() {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-md">
      <div className="flex items-start gap-3">
        <SkeletonPulse className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <SkeletonPulse className="h-4 w-16 rounded-md" />
            <SkeletonPulse className="h-4 w-12 rounded-md" />
          </div>
          <SkeletonPulse className="h-4 w-3/4 mb-2" />
          <SkeletonPulse className="h-3 w-1/2" />
        </div>
        <SkeletonPulse className="h-6 w-16 shrink-0 rounded-full" />
      </div>
    </div>
  );
}

/** Grid of item cards */
export function SkeletonItemGrid({ count = 4, cols = 2 }: { count?: number; cols?: number }) {
  return (
    <div className={`grid gap-4 ${cols === 1 ? "" : "lg:grid-cols-2"}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItemCard key={i} />
      ))}
    </div>
  );
}

/** Section header skeleton */
export function SkeletonSectionHeader() {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 border-b border-white/5 pb-4">
      <SkeletonPulse className="h-6 w-48" />
      <SkeletonPulse className="h-4 w-16" />
    </div>
  );
}

/** Full page header + metrics + content skeleton */
export function SkeletonPageHeader() {
  return (
    <div className="py-4 mb-8">
      <SkeletonPulse className="h-10 w-64 mb-3" />
      <SkeletonPulse className="h-5 w-96 max-w-full" />
    </div>
  );
}

/** Dashboard-specific skeleton */
export function DashboardSkeleton() {
  return (
    <div className="animate-fade-in pb-20">
      {/* Hero */}
      <section className="grid gap-6 mb-8 xl:grid-cols-[1fr_380px] items-stretch">
        <div className="rounded-3xl border border-white/5 bg-black/40 p-8 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-8">
            <SkeletonPulse className="h-2 w-2 rounded-full" />
            <SkeletonPulse className="h-3 w-24" />
          </div>
          <SkeletonPulse className="h-12 w-80 max-w-full mb-4" />
          <SkeletonPulse className="h-5 w-full max-w-xl mb-2" />
          <SkeletonPulse className="h-5 w-3/4 max-w-lg mb-10" />
          <div className="flex gap-4">
            <SkeletonPulse className="h-12 w-36 rounded-full" />
            <SkeletonPulse className="h-12 w-44 rounded-full" />
          </div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-black/40 p-6 backdrop-blur-xl flex flex-col items-center justify-center">
          <SkeletonPulse className="h-[180px] w-[180px] rounded-full mb-4" />
          <SkeletonPulse className="h-3 w-24 mb-4" />
          <SkeletonPulse className="h-[60px] w-full rounded-lg" />
        </div>
      </section>
      <SkeletonMetrics count={5} />
      <SkeletonSectionHeader />
      <SkeletonItemGrid count={4} />
    </div>
  );
}

/** Inbox-specific skeleton */
export function InboxSkeleton() {
  return (
    <div className="animate-fade-in pb-20">
      <SkeletonPageHeader />
      {/* Search & filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <SkeletonPulse className="h-11 w-full max-w-md rounded-xl" />
        <div className="flex gap-2">
          <SkeletonPulse className="h-9 w-20 rounded-lg" />
          <SkeletonPulse className="h-9 w-20 rounded-lg" />
          <SkeletonPulse className="h-9 w-20 rounded-lg" />
        </div>
      </div>
      {/* Filter chips */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-8 w-20 rounded-lg" />
        ))}
      </div>
      <SkeletonSectionHeader />
      <SkeletonItemGrid count={6} cols={1} />
    </div>
  );
}

/** Tasks-specific skeleton */
export function TasksSkeleton() {
  return (
    <div className="animate-fade-in pb-20">
      <SkeletonPageHeader />
      <SkeletonMetrics count={4} />
      {/* Filter chips */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <SkeletonSectionHeader />
      <SkeletonItemGrid count={4} />
    </div>
  );
}

/** Integrations-specific skeleton */
export function IntegrationsSkeleton() {
  return (
    <div className="animate-fade-in pb-20">
      <SkeletonPageHeader />
      <SkeletonMetrics count={4} />
      <SkeletonSectionHeader />
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-black/40 p-6 backdrop-blur-md">
            <div className="flex items-start gap-4 mb-5">
              <SkeletonPulse className="h-12 w-12 rounded-xl shrink-0" />
              <div className="flex-1">
                <SkeletonPulse className="h-5 w-32 mb-2" />
                <SkeletonPulse className="h-3 w-48" />
              </div>
              <SkeletonPulse className="h-7 w-20 rounded-lg" />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="rounded-xl bg-black/20 border border-white/5 p-3">
                  <SkeletonPulse className="h-2 w-12 mb-2" />
                  <SkeletonPulse className="h-4 w-16" />
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 3 }).map((_, j) => (
                <SkeletonPulse key={j} className="h-5 w-16 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Generic fallback skeleton */
export function GenericSkeleton() {
  return (
    <div className="animate-fade-in pb-20">
      <SkeletonPageHeader />
      <SkeletonMetrics count={4} />
      <SkeletonSectionHeader />
      <SkeletonItemGrid count={4} />
    </div>
  );
}
