import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Nav } from "@/components/Nav";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/lib/stocks";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

const ACHIEVEMENTS = [
  { id: "first_blood", name: "First Blood", desc: "Win your first duel", check: (u: any) => u.wins >= 1 },
  { id: "win_streak", name: "Hot Hand", desc: "Win 3 duels", check: (u: any) => u.wins >= 3 },
  { id: "profit_1l", name: "Lakhpati", desc: "Earn ₹1,00,000 lifetime", check: (u: any) => u.totalProfit >= 100000 },
  { id: "veteran", name: "Veteran", desc: "Play 10 matches", check: (u: any) => u.wins + u.losses >= 10 },
  { id: "xp_500", name: "Apprentice", desc: "Reach 500 XP", check: (u: any) => u.xp >= 500 },
  { id: "xp_2k", name: "Market Maker", desc: "Reach 2000 XP", check: (u: any) => u.xp >= 2000 },
];

function rankFor(xp: number) {
  if (xp >= 2000) return "MARKET MAKER";
  if (xp >= 1000) return "STRATEGIST";
  if (xp >= 500) return "APPRENTICE";
  if (xp >= 100) return "ROOKIE";
  return "PAPER HAND";
}

function ProfilePage() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!user) nav({ to: "/login" }); }, [user, nav]);
  if (!user) return null;
  const totalMatches = user.wins + user.losses;
  const wr = totalMatches ? Math.round((user.wins / totalMatches) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        <div className="bg-surface border border-border rounded-sm p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="size-24 rounded-sm flex items-center justify-center font-bold text-background text-4xl" style={{ background: user.avatar }}>
            {user.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="font-mono text-xs text-primary tracking-widest">// {rankFor(user.xp)}</div>
            <h1 className="text-4xl font-extrabold tracking-tighter mt-1">{user.name}</h1>
            <p className="text-muted-foreground font-mono text-sm">{user.email}</p>
          </div>
          <button onClick={() => { logout(); nav({ to: "/" }); }} className="px-4 py-2 border border-border bg-surface-2 rounded-sm font-mono text-xs text-danger hover:border-danger">LOG OUT</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border rounded-sm overflow-hidden">
          <Stat label="XP" value={user.xp.toString()} />
          <Stat label="WINS" value={user.wins.toString()} />
          <Stat label="WIN %" value={wr + "%"} />
          <Stat label="P&L" value={formatINR(user.totalProfit)} accent={user.totalProfit >= 0 ? "primary" : "danger"} />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold mb-4">ACHIEVEMENTS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-sm overflow-hidden">
            {ACHIEVEMENTS.map((a) => {
              const done = a.check(user);
              return (
                <div key={a.id} className={`p-5 bg-surface ${done ? "" : "opacity-40"}`}>
                  <div className={`font-mono text-xs tracking-widest mb-2 ${done ? "text-primary" : "text-muted-foreground"}`}>{done ? "UNLOCKED" : "LOCKED"}</div>
                  <div className="font-bold">{a.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{a.desc}</div>
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
      <div className={`text-2xl font-extrabold mt-1 ${cls}`}>{value}</div>
    </div>
  );
}
