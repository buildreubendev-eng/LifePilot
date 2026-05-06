export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="py-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-stone-950">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
