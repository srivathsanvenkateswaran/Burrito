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
      className={`rounded-xl border border-line bg-surface/50 p-4 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}
