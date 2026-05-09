import { Text } from '@mantine/core';

interface MetricCardProps {
  label: string;
  value: string | number;
  detail: string;
  trend?: "up" | "down" | "neutral" | "success" | "warning" | "danger" | "default";
  accent?: "default" | "success" | "warning" | "danger";
  icon?: React.ReactNode;
}

export function MetricCard({ label, value, detail, trend, accent = "default", icon }: MetricCardProps) {
  const getColors = () => {
    // Treat 'accent' or 'trend' similarly for color fallback
    const effectiveStatus = accent !== "default" ? accent : trend;
    switch (effectiveStatus) {
      case 'success': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'warning': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'danger': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-stone-400 bg-white/5 border-white/5';
    }
  };

  return (
    <div className={`rounded-2xl border p-5 backdrop-blur-md transition-all hover:bg-white/10 shadow-lg ${getColors()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-black/30">
          {icon || (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20V10" />
              <path d="m18 20-6-10-6 10" />
            </svg>
          )}
        </div>
      </div>
      <div className="mt-auto">
        <Text fz={32} fw={800} className="text-white leading-none mb-1 tabular-nums">{value}</Text>
        <Text fz="xs" fw={600} tt="uppercase" lts={1} className="opacity-80">{label}</Text>
        {detail && <Text fz={11} className="mt-2 text-stone-400">{detail}</Text>}
      </div>
    </div>
  );
}
