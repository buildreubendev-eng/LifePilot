export function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white/70 p-8 text-center">
      <h3 className="text-base font-semibold text-stone-950">{title}</h3>
      <p className="mt-2 text-sm text-stone-600">{copy}</p>
    </div>
  );
}
