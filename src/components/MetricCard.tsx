export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-stone-950">{value}</p>
      <p className="mt-2 text-sm text-stone-600">{detail}</p>
    </div>
  );
}
