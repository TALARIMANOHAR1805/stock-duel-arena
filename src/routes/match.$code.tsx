import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Nav } from "@/components/Nav";
import { CandleChart } from "@/components/CandleChart";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/lib/auth";
import { useMatchStore, portfolioValue, pnl, STARTING_CASH, MATCH_DURATION_MS, type PlayerState } from "@/lib/match";
import { STOCKS, currentPrice, priceChangePct, formatINR } from "@/lib/stocks";

export const Route = createFileRoute("/match/$code")({ component: MatchRoom });

function MatchRoom() {
  const { code } = Route.useParams();
  const nav = useNavigate();
  const { user, addResult } = useAuth();
  const match = useMatchStore((s) => s.matches[code]);
  const join = useMatchStore((s) => s.joinMatch);
  const start = useMatchStore((s) => s.startMatch);
  const end = useMatchStore((s) => s.endMatch);
  const ensureBot = useMatchStore((s) => s.ensureBot);
  const tickBot = useMatchStore((s) => s.tickBot);

  // ensure user joins
  useEffect(() => {
    if (!user) { nav({ to: "/login" }); return; }
    if (!match) return;
    if (!match.players[user.id]) join(code, { id: user.id, name: user.name, avatar: user.avatar });
  }, [user, match, code, join, nav]);

  // bot ticks during live match
  useEffect(() => {
    if (!match || match.status !== "live") return;
    const id = setInterval(() => tickBot(code), 4000);
    return () => clearInterval(id);
  }, [match?.status, code, tickBot]);

  // re-render every second for prices and timer
  const [, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // auto-end match
  const reportedRef = useState({ done: false })[0];
  useEffect(() => {
    if (!match || match.status !== "live" || !match.startedAt || !user) return;
    const elapsed = Date.now() - match.startedAt;
    if (elapsed >= match.durationMs) {
      end(code);
    }
  });

  useEffect(() => {
    if (!match || match.status !== "ended" || !user || reportedRef.done) return;
    const me = match.players[user.id];
    if (!me) return;
    reportedRef.done = true;
    const myPnl = pnl(me);
    const won = match.winnerId === user.id;
    const xp = Math.max(50, Math.round(Math.abs(myPnl) / 100)) + (won ? 200 : 50);
    addResult(won, myPnl, xp);
  }, [match?.status]);

  if (!user) return null;
  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <div className="max-w-xl mx-auto p-12 text-center">
          <div className="text-6xl mb-6">🔗</div>
          <h1 className="text-3xl font-extrabold mb-2">ROOM NOT FOUND</h1>
          <p className="text-muted-foreground mb-2 font-mono text-sm">
            Code <span className="text-foreground font-bold">{code}</span> doesn't exist in this browser.
          </p>
          <div className="bg-surface border border-border rounded-sm p-6 mb-6 text-left">
            <p className="font-mono text-xs text-primary tracking-widest mb-3">// HOW TO JOIN A ROOM</p>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Both players must be on <span className="text-foreground font-bold">the same device</span> or the room host must share the room on your browser.</li>
              <li>Ask the host to open the game, create a room, and share the <span className="text-foreground font-bold">room code</span> with you.</li>
              <li>Enter the code at the top of the dashboard to join directly.</li>
            </ol>
          </div>
          <p className="text-xs text-muted-foreground font-mono mb-6">Room code: <span className="text-primary font-bold">{code}</span></p>
          <Link to="/dashboard" className="inline-block bg-primary text-background font-bold px-6 py-3 rounded-sm">BACK TO DASHBOARD</Link>
        </div>
      </div>
    );
  }

  if (match.status === "lobby") return <Lobby code={code} onStart={() => start(code)} onAddBot={() => ensureBot(code)} />;
  if (match.status === "ended") return <Result code={code} />;
  return <Trading code={code} />;
}

// ============ LOBBY ============
function Lobby({ code, onStart, onAddBot }: { code: string; onStart: () => void; onAddBot: () => void }) {
  const match = useMatchStore((s) => s.matches[code])!;
  const { user } = useAuth();
  const players = Object.values(match.players);
  const me = user ? match.players[user.id] : undefined;
  const isHost = me?.id === match.hostId;
  const [copied, setCopied] = useState(false);

  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/match/${code}` : "";

  const copy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="font-mono text-xs text-primary tracking-widest mb-3">// WAITING ROOM</div>
          <h1 className="text-5xl font-extrabold tracking-tighter">ROOM <span className="text-primary">{code}</span></h1>
          <p className="text-muted-foreground mt-3 font-mono text-sm">SHARE THE LINK · WAIT FOR YOUR RIVAL · DROP THE HAMMER</p>
        </div>

        <div className="bg-surface border border-border p-6 rounded-sm flex items-center gap-3 mb-12">
          <input readOnly value={inviteUrl} className="flex-1 bg-transparent font-mono text-sm outline-none truncate" />
          <button onClick={copy} className="px-4 py-2 bg-primary text-background font-bold rounded-sm text-sm">
            {copied ? "COPIED" : "COPY LINK"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <PlayerSlot player={players[0]} />
          <div className="text-center text-primary font-mono text-6xl font-black italic">VS</div>
          <PlayerSlot player={players[1]} />
        </div>

        {isHost && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
            {players.length < 2 && (
              <button onClick={onAddBot} className="px-6 py-3 bg-surface border border-border font-bold rounded-sm hover:bg-surface-2">
                ADD MARKETBOT
              </button>
            )}
            <button
              onClick={onStart}
              disabled={players.length < 2}
              className="px-8 py-4 bg-primary text-background font-bold rounded-sm disabled:opacity-40 hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-all"
            >
              START DUEL · 10:00
            </button>
          </div>
        )}
        {!isHost && (
          <p className="text-center mt-12 font-mono text-muted-foreground text-sm">WAITING FOR HOST TO START…</p>
        )}
      </div>
    </div>
  );
}

function PlayerSlot({ player }: { player?: PlayerState }) {
  if (!player) {
    return (
      <div className="bg-surface border border-dashed border-border p-8 rounded-sm flex flex-col items-center gap-4 text-center">
        <div className="size-16 rounded-sm bg-background border border-border" />
        <div className="font-mono text-muted-foreground text-sm">EMPTY SLOT</div>
      </div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="bg-surface border border-primary/40 p-8 rounded-sm flex flex-col items-center gap-4 text-center"
    >
      <Avatar name={player.name} color={player.avatar} size={64} />
      <div className="font-bold text-lg">{player.name}</div>
      <div className="font-mono text-xs text-primary">READY</div>
    </motion.div>
  );
}

// ============ TRADING ============
function Trading({ code }: { code: string }) {
  const { user } = useAuth();
  const match = useMatchStore((s) => s.matches[code])!;
  const trade = useMatchStore((s) => s.trade);
  const [selected, setSelected] = useState(STOCKS[0].symbol);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [qty, setQty] = useState(10);
  const [err, setErr] = useState("");
  const [flash, setFlash] = useState<"ok" | "no" | null>(null);

  const me = match.players[user!.id];
  const opponent = Object.values(match.players).find((p) => p.id !== user!.id);
  const remaining = Math.max(0, (match.startedAt ?? 0) + match.durationMs - Date.now());
  const mm = Math.floor(remaining / 60000).toString().padStart(2, "0");
  const ss = Math.floor((remaining % 60000) / 1000).toString().padStart(2, "0");

  const myVal = portfolioValue(me);
  const myPnl = myVal - STARTING_CASH;
  const oppVal = opponent ? portfolioValue(opponent) : 0;
  const oppPnl = oppVal - STARTING_CASH;
  const totalSplit = Math.max(1, myVal + oppVal);
  const myShare = (myVal / totalSplit) * 100;

  const price = currentPrice(selected);
  const cost = price * qty;

  const submit = () => {
    setErr("");
    const e = trade(code, user!.id, side, selected, qty);
    if (e) { setErr(e); setFlash("no"); }
    else { setFlash("ok"); }
    setTimeout(() => setFlash(null), 600);
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface border border-border rounded-sm p-6">
            <div className="flex items-center justify-between gap-4">
              <PlayerBadge player={me} pnl={myPnl} side="left" />
              <div className="text-center">
                <div className="px-4 py-1 bg-primary/10 text-primary border border-primary/30 rounded-sm font-mono font-bold text-2xl">{mm}:{ss}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">REMAINING</div>
              </div>
              <PlayerBadge player={opponent} pnl={oppPnl} side="right" />
            </div>
            <div className="mt-6 h-2 w-full bg-background rounded-full overflow-hidden flex border border-border">
              <div className="h-full bg-primary transition-all" style={{ width: `${myShare}%` }} />
              <div className="h-full bg-danger transition-all" style={{ width: `${100 - myShare}%` }} />
            </div>
          </div>
          <div className="bg-surface border border-border rounded-sm p-6">
            <div className="font-mono text-[10px] text-muted-foreground tracking-widest">YOUR PORTFOLIO</div>
            <div className={`text-3xl font-extrabold mt-1 ${myPnl >= 0 ? "text-primary" : "text-danger"}`}>
              {formatINR(myVal)}
            </div>
            <div className="font-mono text-xs mt-1">
              <span className="text-muted-foreground">CASH </span>
              <span>{formatINR(me.cash)}</span>
              <span className="text-muted-foreground"> · P&L </span>
              <span className={myPnl >= 0 ? "text-primary" : "text-danger"}>
                {myPnl >= 0 ? "+" : ""}{formatINR(myPnl)}
              </span>
            </div>
          </div>
        </div>

        {/* Trading floor */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Watchlist */}
          <div className="bg-surface border border-border rounded-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border font-mono text-[10px] text-muted-foreground tracking-widest">MARKET WATCH</div>
            <div className="divide-y divide-border">
              {STOCKS.map((s) => {
                const p = currentPrice(s.symbol);
                const ch = priceChangePct(s.symbol);
                const active = selected === s.symbol;
                return (
                  <button key={s.symbol} onClick={() => setSelected(s.symbol)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-surface-2 transition-colors ${active ? "bg-surface-2" : ""}`}>
                    <div>
                      <div className="font-bold text-sm">{s.symbol}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{s.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">₹{p.toFixed(2)}</div>
                      <div className={`font-mono text-[10px] ${ch >= 0 ? "text-primary" : "text-danger"}`}>{ch >= 0 ? "+" : ""}{ch.toFixed(2)}%</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-sm p-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <div>
                <div className="font-bold text-lg">{selected}</div>
                <div className="font-mono text-xs text-muted-foreground">5s candles</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl">₹{price.toFixed(2)}</div>
                <div className={`font-mono text-xs ${priceChangePct(selected) >= 0 ? "text-primary" : "text-danger"}`}>
                  {priceChangePct(selected) >= 0 ? "+" : ""}{priceChangePct(selected).toFixed(2)}%
                </div>
              </div>
            </div>
            <CandleChart symbol={selected} height={340} />
          </div>

          {/* Order + holdings */}
          <div className="space-y-6">
            <div className={`bg-surface border border-border rounded-sm p-6 ${flash === "ok" ? "flash-green" : flash === "no" ? "flash-red" : ""}`}>
              <div className="font-mono text-[10px] text-muted-foreground tracking-widest mb-3">QUICK TRADE</div>
              <div className="flex gap-2 p-1 bg-background rounded-sm mb-4 border border-border">
                <button onClick={() => setSide("BUY")} className={`flex-1 py-2 rounded-sm font-bold text-sm ${side === "BUY" ? "bg-primary text-background" : "text-muted-foreground"}`}>BUY</button>
                <button onClick={() => setSide("SELL")} className={`flex-1 py-2 rounded-sm font-bold text-sm ${side === "SELL" ? "bg-danger text-foreground" : "text-muted-foreground"}`}>SELL</button>
              </div>
              <label className="block">
                <span className="text-[10px] font-mono text-muted-foreground tracking-widest">QUANTITY</span>
                <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full mt-1 bg-background border border-border rounded-sm p-3 font-mono outline-none focus:border-primary" />
              </label>
              <div className="flex justify-between text-xs mt-3 font-mono">
                <span className="text-muted-foreground">EST. COST</span>
                <span>{formatINR(cost)}</span>
              </div>
              {err && <p className="text-danger text-xs font-mono mt-2">{err}</p>}
              <button onClick={submit} className="w-full mt-4 py-3 bg-foreground text-background font-bold rounded-sm hover:bg-primary transition-colors">
                PLACE ORDER
              </button>
            </div>

            <div className="bg-surface border border-border rounded-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border font-mono text-[10px] text-muted-foreground tracking-widest">OPEN POSITIONS</div>
              {me.holdings.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground font-mono">NO POSITIONS YET</div>
              ) : (
                <div className="divide-y divide-border">
                  {me.holdings.map((h) => {
                    const p = currentPrice(h.symbol);
                    const pl = (p - h.avgPrice) * h.qty;
                    return (
                      <div key={h.symbol} className="px-4 py-3 flex items-center justify-between text-sm">
                        <div>
                          <div className="font-bold">{h.symbol} <span className="text-muted-foreground font-mono text-xs">×{h.qty}</span></div>
                          <div className="font-mono text-[10px] text-muted-foreground">AVG ₹{h.avgPrice.toFixed(2)}</div>
                        </div>
                        <div className={`font-mono text-sm ${pl >= 0 ? "text-primary" : "text-danger"}`}>{pl >= 0 ? "+" : ""}{formatINR(pl)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerBadge({ player, pnl: pl, side }: { player?: PlayerState; pnl: number; side: "left" | "right" }) {
  if (!player) return <div />;
  const cls = pl >= 0 ? "text-primary bg-primary/10 border-primary/30" : "text-danger bg-danger/10 border-danger/30";
  const align = side === "left" ? "items-start" : "items-end";
  return (
    <div className={`flex flex-col gap-2 ${align}`}>
      <div className="flex items-center gap-3">
        {side === "left" && <Avatar name={player.name} color={player.avatar} size={40} />}
        <div className={side === "left" ? "" : "text-right"}>
          <div className="text-[10px] font-mono text-muted-foreground tracking-widest">{side === "left" ? "YOU" : "RIVAL"}</div>
          <div className="font-bold">{player.name}</div>
        </div>
        {side === "right" && <Avatar name={player.name} color={player.avatar} size={40} />}
      </div>
      <div className={`px-3 py-1 border rounded-sm text-xs font-mono font-bold ${cls}`}>
        {pl >= 0 ? "+" : ""}{formatINR(pl)}
      </div>
    </div>
  );
}

// ============ RESULT ============
function Result({ code }: { code: string }) {
  const { user } = useAuth();
  const match = useMatchStore((s) => s.matches[code])!;
  const me = match.players[user!.id];
  const opp = Object.values(match.players).find((p) => p.id !== user!.id);
  const won = match.winnerId === user!.id;
  const myPnl = pnl(me);
  const oppPnl = opp ? pnl(opp) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
          >
            <div className={`font-mono text-xs tracking-widest mb-4 ${won ? "text-primary" : "text-danger"}`}>
              // MATCH ENDED
            </div>
            <h1 className={`text-7xl md:text-8xl font-extrabold tracking-tighter mb-6 ${won ? "text-primary" : "text-danger"}`}>
              {won ? "VICTORY" : "DEFEAT"}
            </h1>
            <p className="text-muted-foreground font-mono text-sm mb-12">
              {won ? "You out-traded your rival." : "The market wasn't on your side this time."}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border rounded-sm overflow-hidden mb-8">
          <div className="p-6 bg-surface text-left">
            <div className="font-mono text-[10px] text-muted-foreground tracking-widest">YOU · {me.name}</div>
            <div className={`text-3xl font-extrabold mt-1 ${myPnl >= 0 ? "text-primary" : "text-danger"}`}>
              {myPnl >= 0 ? "+" : ""}{formatINR(myPnl)}
            </div>
            <div className="font-mono text-xs text-muted-foreground mt-1">PORTFOLIO {formatINR(portfolioValue(me))}</div>
          </div>
          {opp && (
            <div className="p-6 bg-surface text-left">
              <div className="font-mono text-[10px] text-muted-foreground tracking-widest">RIVAL · {opp.name}</div>
              <div className={`text-3xl font-extrabold mt-1 ${oppPnl >= 0 ? "text-primary" : "text-danger"}`}>
                {oppPnl >= 0 ? "+" : ""}{formatINR(oppPnl)}
              </div>
              <div className="font-mono text-xs text-muted-foreground mt-1">PORTFOLIO {formatINR(portfolioValue(opp))}</div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link to="/match/create" className="px-6 py-3 bg-primary text-background font-bold rounded-sm">REMATCH</Link>
          <Link to="/dashboard" className="px-6 py-3 bg-surface border border-border font-bold rounded-sm">DASHBOARD</Link>
          <Link to="/leaderboard" className="px-6 py-3 bg-surface border border-border font-bold rounded-sm">LEADERBOARD</Link>
        </div>

        <div className="mt-12 text-left">
          <h3 className="font-mono text-xs text-muted-foreground tracking-widest mb-4">YOUR TRADES</h3>
          <div className="bg-surface border border-border rounded-sm overflow-hidden">
            {me.trades.length === 0 ? (
              <div className="p-4 font-mono text-xs text-muted-foreground">NO TRADES PLACED</div>
            ) : (
              <table className="w-full text-sm font-mono">
                <thead><tr className="text-[10px] text-muted-foreground border-b border-border tracking-widest">
                  <th className="text-left p-3">TIME</th><th className="text-left p-3">SIDE</th><th className="text-left p-3">SYMBOL</th><th className="text-right p-3">QTY</th><th className="text-right p-3">PRICE</th>
                </tr></thead>
                <tbody>
                  {me.trades.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0">
                      <td className="p-3 text-muted-foreground">{new Date(t.ts).toLocaleTimeString()}</td>
                      <td className={`p-3 ${t.side === "BUY" ? "text-primary" : "text-danger"}`}>{t.side}</td>
                      <td className="p-3">{t.symbol}</td>
                      <td className="p-3 text-right">{t.qty}</td>
                      <td className="p-3 text-right">₹{t.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
