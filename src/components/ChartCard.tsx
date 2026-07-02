/** Bordered container that frames a chart and marks its interaction area. */
export default function ChartCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-neutral-800 bg-neutral-900/30 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${className}`}
    >
      {children}
    </div>
  );
}
