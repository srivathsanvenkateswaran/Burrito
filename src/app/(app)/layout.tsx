import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { loadMetrics } from "@/lib/data";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const rows = loadMetrics().rows;
  const latest = rows.at(-1)!;
  const prev = rows.at(-2)!;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Header
          price={latest.close}
          changePct={((latest.close - prev.close) / prev.close) * 100}
          risk={latest.risk}
          date={latest.date}
        />
        {children}
      </div>
    </div>
  );
}
