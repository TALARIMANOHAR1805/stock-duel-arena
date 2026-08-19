import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Nav } from "@/components/Nav";
import { Ticker } from "@/components/Ticker";
import { CandleChart } from "@/components/CandleChart";
import { useAuth, getLeaderboard } from "@/lib/auth";
import { formatINR } from "@/lib/stocks";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const { user } = useAuth();
  const lb = getLeaderboard().slice(0, 3);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Ticker />

      <section className="relative pt-24 pb-32 overflow-hidden grid-bg">
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full mb-8"
          >
            <span className="size-2 bg-primary rounded-full animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-primary tracking-widest uppercase">SEASON 1 · NSE ARENA LIVE</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-8"
          >
            YOUR PORTFOLIO<br />
            <span className="text-primary">IS THE WEAPON.</span>
          </motion.h1>

          <p className="max-w-2xl mx-auto text-muted-foreground text-lg mb-12">
            1v1 real-time stock duels. ₹1,00,000 virtual capital. 10 minutes to dominate the market and take the crown.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={user ? "/match/create" : "/signup"} className="w-full sm:w-64 h-14 bg-primary text-background font-bold rounded-sm hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-all flex items-center justify-center gap-3">
              CREATE MATCH
            </Link>
            <Link to={user ? "/dashboard" : "/login"} className="w-full sm:w-64 h-14 bg-surface border border-border font-bold rounded-sm hover:bg-surface-2 transition-all flex items-center justify-center">
              JOIN MATCH
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-24 relative"
          >
            <div className="absolute -inset-24 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="w-full max-w-5xl mx-auto bg-surface border border-border rounded-lg overflow-hidden shadow-2xl relative">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/50">
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="size-2 bg-primary rounded-full animate-pulse" />
                  <span>RELIANCE / INR</span>
                  <span className="text-primary">LIVE</span>
                </div>
                <span className="font-mono text-[10px] text-muted">ARENA_PREVIEW.DAT</span>
              </div>
              <div className="p-4">
                <CandleChart symbol="RELIANCE" height={360} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-32 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-12">
            <div className="text-center md:text-right">
              <h3 className="text-2xl font-bold mb-4">PICK YOUR STOCKS</h3>
              <p className="text-muted-foreground">Analyze live technicals and build your offensive positions in seconds.</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="text-primary font-mono text-5xl font-black italic tracking-tighter">VS</div>
              <div className="w-px h-24 bg-gradient-to-b from-primary to-transparent" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-4">OUTLAST THE RIVAL</h3>
              <p className="text-muted-foreground">Watch the clock. Monitor their P&L. Pivot before the closing bell.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {[
              { n: "01", t: "REALTIME", h: "Live Candles", d: "Tick-by-tick simulated NSE candlesticks rendered with TradingView Lightweight Charts." },
              { n: "02", t: "SOCIAL", h: "Custom Rooms", d: "Spin up a private arena and share an invite link with a friend in seconds." },
              { n: "03", t: "PROGRESSION", h: "XP & Ranks", d: "Earn XP per duel. Climb from Paper Hand to Market Maker on the global ladder." },
              { n: "04", t: "ANALYSIS", h: "Match Review", d: "Holdings, average price, trade history and P&L tracked for every match." },
            ].map((f) => (
              <div key={f.n} className="p-8 bg-surface hover:bg-surface-2 transition-colors">
                <div className="font-mono text-primary text-sm mb-6">{f.n} // {f.t}</div>
                <h4 className="text-xl font-bold mb-3">{f.h}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 border-t border-border">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight">TOP TRADERS</h2>
              <p className="text-muted-foreground font-mono text-xs uppercase mt-2">GLOBAL RANKING / NET PROFIT</p>
            </div>
            <Link to="/leaderboard" className="text-primary text-sm font-bold border-b border-primary">View All</Link>
          </div>
          <div className="space-y-1">
            {(lb.length ? lb : [{ id: "x", name: "Be the first", avatar: "#27272a", totalProfit: 0 } as any]).map((u, i) => (
              <div key={u.id} className="flex items-center justify-between p-4 bg-surface/50 border border-border">
                <div className="flex items-center gap-6">
                  <span className={`font-mono font-bold ${i === 0 ? "text-primary" : "text-muted"}`}>#{String(i + 1).padStart(2, "0")}</span>
                  <span className="size-10 rounded-sm flex items-center justify-center font-bold text-background" style={{ background: u.avatar }}>
                    {u.name[0]?.toUpperCase()}
                  </span>
                  <span className="font-bold">{u.name}</span>
                </div>
                <span className={`font-mono ${u.totalProfit >= 0 ? "text-primary" : "text-danger"}`}>
                  {u.totalProfit >= 0 ? "+" : ""}{formatINR(u.totalProfit)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="size-6 bg-primary rounded-sm flex items-center justify-center">
              <div className="size-3 bg-background rotate-45" />
            </div>
            <span className="font-bold tracking-tighter">TRADE LEARN</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">EDUCATIONAL USE ONLY · NO REAL CURRENCY INVOLVED</p>
          <div className="flex gap-6 text-xs font-mono text-muted-foreground">
            <span>v1.0.0-BETA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
