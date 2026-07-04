import Link from "next/link";
import MobileSidebar from "./MobileSidebar";
import ThemeToggle from "./ThemeToggle";

interface Props {
  price: number;
  changePct: number;
  risk: number | null;
  date: string;
}

export default function Header({ price, changePct, risk, date }: Props) {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b border-line bg-ink/85 px-4 backdrop-blur sm:gap-4 sm:px-6">
      <MobileSidebar />
      <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-faint sm:inline">
        BTC / USD
      </span>
      <span className="font-mono text-sm text-fg">
        ${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}
      </span>
      <span className={`font-mono text-xs ${changePct >= 0 ? "text-gain" : "text-loss"}`}>
        {changePct >= 0 ? "+" : ""}
        {changePct.toFixed(2)}%
      </span>
      {risk !== null && (
        <span className="hidden items-center gap-1.5 font-mono text-xs text-muted sm:flex">
          <span className="text-faint">·</span> risk {risk.toFixed(2)}
        </span>
      )}
      <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-faint md:inline">
        {date}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/"
          className="hidden rounded-md border border-line px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-faint/60 hover:text-fg sm:inline"
        >
          Home
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
