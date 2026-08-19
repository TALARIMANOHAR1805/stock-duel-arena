import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Nav } from "@/components/Nav";
import { useAuth } from "@/lib/auth";
import { useMatchStore, portfolioValue, pnl } from "@/lib/match";
import { currentPrice, formatINR } from "@/lib/stocks";

export const Route = createFileRoute("/portfolio")({ component: PortfolioPage });

function PortfolioPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!user) nav({ to: "/login" }); }, [user, nav]);
  if (!user) return null;

  // Aggregate across all matches the user has been in
  const matches = useMatchStore((s) => s.matches);
  const myStates = Object.values(matches).map((m) => m.players[user.id]).filter(Boolean);

  const allTrades = myStates.flatMap((p) => p.trades).sort((a, b) => b.ts - a.ts);
  const lastMatch = myStates[myStates.length - 1];

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        <div>
          <div className="font-mono text-xs text-primary tracking-widest mb-2">// PORTFOLIO</div>
          <h1 className="text-4xl font-extrabold tracking-tighter">{user.name}</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border border border-border rounded-sm overflow-hidden">
          <Stat label="LIFETIME P&L" value={formatINR(user.totalProfit)} accent={user.totalProfit >= 0 ? "primary" : "danger"} />
          <Stat label="MATCHES" value={(user.wins + user.losses).toString()} />
          <Stat label="WIN RATE" value={user.wins + user.losses ? Math.round((user.wins / (user.wins + user.losses)) * 100) + "%" : "—"} />
        </div>

        {lastMatch && (
          <div>
            <h2 className="text-2xl font-extrabold mb-4">LAST MATCH HOLDINGS</h2>
            <div className="bg-surface border border-border rounded-sm overflow-hidden">
              {lastMatch.holdings.length === 0 ? (
                <div className="p-6 font-mono text-xs text-muted-foreground">NO HOLDINGS</div>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="text-[10px] font-mono text-muted-foreground tracking-widest border-b border-border">
                    <th className="text-left p-4">SYMBOL</th><th className="text-right p-4">QTY</th><th className="text-right p-4">AVG</th><th className="text-right p-4">LTP</th><th className="text-right p-4">P&L</th>
                  </tr></thead>
                  <tbody>
                    {lastMatch.holdings.map((h) => {
                      const p = currentPrice(h.symbol);
                      const pl = (p - h.avgPrice) * h.qty;
                      return (
                        <tr key={h.symbol} className="border-b border-border last:border-0">
                          <td className="p-4 font-bold">{h.symbol}</td>
                          <td className="p-4 text-right font-mono">{h.qty}</td>
                          <td className="p-4 text-right font-mono">₹{h.avgPrice.toFixed(2)}</td>
                          <td className="p-4 text-right font-mono">₹{p.toFixed(2)}</td>
                          <td className={`p-4 text-right font-mono ${pl >= 0 ? "text-primary" : "text-danger"}`}>{pl >= 0 ? "+" : ""}{formatINR(pl)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              <div className="px-4 py-3 border-t border-border flex justify-between font-mono text-xs">
                <span className="text-muted-foreground">PORTFOLIO VALUE</span>
                <span>{formatINR(portfolioValue(lastMatch))} <span className={pnl(lastMatch) >= 0 ? "text-primary" : "text-danger"}>({pnl(lastMatch) >= 0 ? "+" : ""}{formatINR(pnl(lastMatch))})</span></span>
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-extrabold mb-4">TRADE HISTORY</h2>
          <div className="bg-surface border border-border rounded-sm overflow-hidden">
            {allTrades.length === 0 ? (
              <div className="p-6 font-mono text-xs text-muted-foreground">NO TRADES YET</div>
            ) : (
              <table className="w-full text-sm font-mono">
                <thead><tr className="text-[10px] text-muted-foreground tracking-widest border-b border-border">
                  <th className="text-left p-4">TIME</th><th className="text-left p-4">SIDE</th><th className="text-left p-4">SYMBOL</th><th className="text-right p-4">QTY</th><th className="text-right p-4">PRICE</th>
                </tr></thead>
                <tbody>
                  {allTrades.slice(0, 50).map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0">
                      <td className="p-4 text-muted-foreground">{new Date(t.ts).toLocaleString()}</td>
                      <td className={`p-4 ${t.side === "BUY" ? "text-primary" : "text-danger"}`}>{t.side}</td>
                      <td className="p-4">{t.symbol}</td>
                      <td className="p-4 text-right">{t.qty}</td>
                      <td className="p-4 text-right">₹{t.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "primary" | "danger" }) {
  const cls = accent === "primary" ? "text-primary" : accent === "danger" ? "text-danger" : "text-foreground";
  return (
    <div className="p-6 bg-surface">
      <div className="font-mono text-[10px] text-muted-foreground tracking-widest">{label}</div>
      <div className={`text-3xl font-extrabold mt-1 ${cls}`}>{value}</div>
    </div>
  );
}
