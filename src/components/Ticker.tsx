import { useEffect, useState } from "react";
import { STOCKS, currentPrice, priceChangePct } from "@/lib/stocks";

export function Ticker() {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 2000);
    return () => clearInterval(id);
  }, []);
  const items = STOCKS.map((s) => {
    const p = currentPrice(s.symbol);
    const ch = priceChangePct(s.symbol);
    const cls = ch > 0.05 ? "text-primary" : ch < -0.05 ? "text-danger" : "text-muted";
    const sign = ch > 0 ? "+" : "";
    return { sym: s.symbol, p, ch, cls, sign };
  });
  const row = (
    <div className="flex gap-8 px-4 font-mono text-xs items-center shrink-0">
      {items.map((i) => (
        <span key={i.sym} className="flex gap-2">
          <span className="text-foreground/80">{i.sym}</span>
          <span className={i.cls}>₹{i.p.toFixed(2)} ({i.sign}{i.ch.toFixed(2)}%)</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="border-b border-border bg-surface/50 py-2 overflow-hidden whitespace-nowrap">
      <div className="flex animate-ticker">
        {row}{row}
      </div>
    </div>
  );
}
