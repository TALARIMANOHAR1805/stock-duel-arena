import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Nav } from "@/components/Nav";
import { Ticker } from "@/components/Ticker";
import { useAuth } from "@/lib/auth";
import { STOCKS, currentPrice, priceChangePct, formatINR } from "@/lib/stocks";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!user) nav({ to: "/login" }); }, [user, nav]);
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <Ticker />
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border rounded-sm overflow-hidden">
          <Stat label="XP" value={user.xp.toString()} />
          <Stat label="WINS" value={user.wins.toString()} />
          <Stat label="NET P&L" value={formatINR(user.totalProfit)} accent={user.totalProfit >= 0 ? "primary" : "danger"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Link to="/match/create" className="group p-10 bg-surface border border-border hover:border-primary transition-colors rounded-sm">
            <div className="font-mono text-primary text-xs mb-3">01 // HOST</div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-3">CREATE MATCH</h2>
            <p className="text-muted-foreground text-sm">Spin up a private arena, share the invite link, and start trading.</p>
          </Link>
          <div className="p-10 bg-surface border border-border rounded-sm">
            <div className="font-mono text-primary text-xs mb-3">02 // CHALLENGER</div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-3">JOIN MATCH</h2>
            <JoinForm />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold tracking-tight mb-6">TRENDING</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-border border border-border rounded-sm overflow-hidden">
            {STOCKS.map((s) => {
              const p = currentPrice(s.symbol);
              const ch = priceChangePct(s.symbol);
              const cls = ch >= 0 ? "text-primary" : "text-danger";
              return (
                <div key={s.symbol} className="p-4 bg-surface">
                  <div className="font-mono text-xs text-muted-foreground">{s.symbol}</div>
                  <div className="font-bold mt-1 truncate">{s.name}</div>
                  <div className="font-mono text-lg mt-2">₹{p.toFixed(2)}</div>
                  <div className={`font-mono text-xs ${cls}`}>{ch >= 0 ? "+" : ""}{ch.toFixed(2)}%</div>
                </div>
              );
            })}
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

function JoinForm() {
  const nav = useNavigate();
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const code = (new FormData(e.currentTarget).get("code") as string || "").toUpperCase().trim();
      if (code) nav({ to: "/match/$code", params: { code } });
    }} className="flex gap-2 mt-3">
      <input name="code" placeholder="ROOM CODE" maxLength={6}
        className="flex-1 bg-background border border-border rounded-sm px-3 py-3 font-mono uppercase tracking-widest outline-none focus:border-primary" />
      <button className="px-6 bg-primary text-background font-bold rounded-sm">JOIN</button>
    </form>
  );
}
