"use client";

import { useMemo } from "react";
import { DonutChart, BarChart, AreaChart } from "@mantine/charts";
import { Text } from "@mantine/core";
import type { LifeAdminMessage } from "@/lib/types";
import { DollarSign, PieChart, TrendingUp, BarChart3 } from "lucide-react";

const categoryColors: Record<string, string> = {
  bill: "#f43f5e",
  renewal: "#f59e0b",
  appointment: "#3b82f6",
  travel: "#8b5cf6",
  medical: "#ec4899",
  insurance: "#06b6d4",
  subscription: "#84cc16",
  receipt: "#64748b",
  "school/family": "#14b8a6",
  "tax/document": "#f97316",
  "personal reply": "#a78bfa",
};

const categoryLabels: Record<string, string> = {
  bill: "Bills",
  renewal: "Renewals",
  appointment: "Appointments",
  travel: "Travel",
  medical: "Medical",
  insurance: "Insurance",
  subscription: "Subscriptions",
  receipt: "Receipts",
  "school/family": "Family",
  "tax/document": "Tax & Docs",
  "personal reply": "Personal",
};

/** Category Distribution Donut */
export function CategoryDistribution({ items }: { items: LifeAdminMessage[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({
        name: categoryLabels[name] || name,
        value,
        color: categoryColors[name] || "#64748b",
      }))
      .sort((a, b) => b.value - a.value);
  }, [items]);

  if (data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/5 bg-black/40 p-6 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-violet-500/10">
          <PieChart size={14} className="text-violet-400" />
        </div>
        <h3 className="text-sm font-bold text-white">Category Distribution</h3>
      </div>
      <div className="flex items-center justify-center mb-4">
        <DonutChart
          data={data}
          size={160}
          thickness={24}
          paddingAngle={2}
          withTooltip
          tooltipDataSource="segment"
          chartLabel={String(items.length)}
        />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {data.slice(0, 6).map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-[11px] text-stone-400 truncate">{d.name}</span>
            <span className="text-[11px] font-bold text-stone-300 ml-auto tabular-nums">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Status Distribution Bar */
export function StatusDistribution({ items }: { items: LifeAdminMessage[] }) {
  const data = useMemo(() => {
    const counts = { new: 0, reviewed: 0, completed: 0, ignored: 0 };
    for (const item of items) {
      if (item.status in counts) {
        counts[item.status as keyof typeof counts]++;
      }
    }
    return [
      { status: "New", count: counts.new, color: "blue.5" },
      { status: "Reviewed", count: counts.reviewed, color: "amber.5" },
      { status: "Completed", count: counts.completed, color: "teal.5" },
      { status: "Ignored", count: counts.ignored, color: "gray.5" },
    ];
  }, [items]);

  return (
    <div className="rounded-2xl border border-white/5 bg-black/40 p-6 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-blue-500/10">
          <BarChart3 size={14} className="text-blue-400" />
        </div>
        <h3 className="text-sm font-bold text-white">Status Overview</h3>
      </div>
      <BarChart
        h={140}
        data={data}
        dataKey="status"
        series={[{ name: "count", color: "teal.6" }]}
        withTooltip
        withBarValueLabel
        barProps={{ radius: 6 }}
        withXAxis
        withYAxis={false}
        gridAxis="none"
        tickLine="none"
        xAxisProps={{ tick: { fill: "#78716c", fontSize: 11 } }}
        valueFormatter={(v) => String(v)}
      />
    </div>
  );
}

/** Financial Exposure Gauge */
export function FinancialExposure({ items }: { items: LifeAdminMessage[] }) {
  const { total, breakdown } = useMemo(() => {
    let sum = 0;
    const cats: Record<string, number> = {};
    for (const item of items) {
      if (item.financialImpact && item.financialImpact > 0) {
        sum += item.financialImpact;
        const cat = categoryLabels[item.category] || item.category;
        cats[cat] = (cats[cat] || 0) + item.financialImpact;
      }
    }
    const sorted = Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    return { total: sum, breakdown: sorted };
  }, [items]);

  // Gauge bar fill percentage (cap at 100%)
  const maxExposure = 5000;
  const fillPercent = Math.min((total / maxExposure) * 100, 100);
  const riskLevel = total < 500 ? "Low" : total < 2000 ? "Moderate" : "High";
  const riskColor = total < 500 ? "text-emerald-400" : total < 2000 ? "text-amber-400" : "text-red-400";
  const barColor = total < 500 ? "bg-emerald-500" : total < 2000 ? "bg-amber-500" : "bg-red-500";
  const barGlow = total < 500 ? "shadow-emerald-500/30" : total < 2000 ? "shadow-amber-500/30" : "shadow-red-500/30";

  return (
    <div className="rounded-2xl border border-white/5 bg-black/40 p-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            <DollarSign size={14} className="text-emerald-400" />
          </div>
          <h3 className="text-sm font-bold text-white">Financial Exposure</h3>
        </div>
        <span className={`text-xs font-bold ${riskColor}`}>{riskLevel} Risk</span>
      </div>

      {/* Gauge */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <Text fz={28} fw={800} className="text-white tabular-nums">
            ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <span className="text-[10px] text-stone-500">/ $5,000 cap</span>
        </div>
        <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${barColor} shadow-lg ${barGlow}`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      {/* Breakdown */}
      {breakdown.length > 0 && (
        <div className="space-y-1.5 border-t border-white/5 pt-3">
          {breakdown.slice(0, 4).map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <span className="text-[11px] text-stone-400">{item.name}</span>
              <span className="text-[11px] font-bold text-stone-300 tabular-nums">
                ${item.value.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Weekly Activity Trend — stacked sparkline */
export function WeeklyTrend({ items }: { items: LifeAdminMessage[] }) {
  const data = useMemo(() => {
    // Generate last 7 days with mock activity counts per status
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      // Use item count + jitter for realistic mock data
      const base = Math.floor(items.length / 7);
      return {
        day: dayLabel,
        Processed: base + Math.floor(Math.random() * 4),
        Pending: Math.floor(Math.random() * 3) + 1,
        Flagged: Math.floor(Math.random() * 2),
      };
    });
  }, [items]);

  return (
    <div className="rounded-2xl border border-white/5 bg-black/40 p-6 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-cyan-500/10">
          <TrendingUp size={14} className="text-cyan-400" />
        </div>
        <h3 className="text-sm font-bold text-white">Weekly Activity</h3>
      </div>
      <AreaChart
        h={140}
        data={data}
        dataKey="day"
        series={[
          { name: "Processed", color: "teal.5" },
          { name: "Pending", color: "yellow.5" },
          { name: "Flagged", color: "red.5" },
        ]}
        curveType="monotone"
        withDots={false}
        withTooltip
        fillOpacity={0.15}
        strokeWidth={2}
        gridAxis="none"
        withYAxis={false}
        xAxisProps={{ tick: { fill: "#78716c", fontSize: 11 } }}
      />
      <div className="flex items-center gap-4 mt-3">
        {[
          { label: "Processed", color: "bg-teal-500" },
          { label: "Pending", color: "bg-yellow-500" },
          { label: "Flagged", color: "bg-red-500" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${l.color}`} />
            <span className="text-[10px] text-stone-500">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
