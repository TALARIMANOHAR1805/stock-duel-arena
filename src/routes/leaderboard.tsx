import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { getLeaderboard } from "@/lib/auth";
import { formatINR } from "@/lib/stocks";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
  head: () => ({ meta: [{ title: "Leaderboard — Trade Learn" }, { name: "description", content: "Top traders across all Trade Learn matches." }] }),
});

function LeaderboardPage() {
  const lb = getLeaderboard();
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="font-mono text-xs text-primary tracking-widest mb-2">// GLOBAL RANKING</div>
          <h1 className="text-5xl font-extrabold tracking-tighter">LEADERBOARD</h1>
        </div>

        <div className="bg-surface border border-border rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-mono text-muted-foreground tracking-widest border-b border-border">
                <th className="text-left p-4">RANK</th>
                <th className="text-left p-4">TRADER</th>
                <th className="text-right p-4">WINS</th>
                <th className="text-right p-4">XP</th>
                <th className="text-right p-4">NET P&L</th>
              </tr>
            </thead>
            <tbody>
              {lb.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center font-mono text-muted-foreground text-xs">NO TRADERS YET — BE THE FIRST</td></tr>
              )}
              {lb.map((u, i) => {
                const total = u.wins + u.losses;
                const wr = total ? Math.round((u.wins / total) * 100) : 0;
                return (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="p-4 font-mono font-bold">
                      <span className={i === 0 ? "text-primary" : i < 3 ? "text-foreground" : "text-muted-foreground"}>
                        #{String(i + 1).padStart(2, "0")}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="size-9 rounded-sm flex items-center justify-center font-bold text-background" style={{ background: u.avatar }}>{u.name[0]?.toUpperCase()}</span>
                        <div>
                          <div className="font-bold">{u.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">WR {wr}%</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono">{u.wins}</td>
                    <td className="p-4 text-right font-mono text-primary">{u.xp}</td>
                    <td className={`p-4 text-right font-mono ${u.totalProfit >= 0 ? "text-primary" : "text-danger"}`}>
                      {u.totalProfit >= 0 ? "+" : ""}{formatINR(u.totalProfit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
