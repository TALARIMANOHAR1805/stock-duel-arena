import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { currentPrice, STOCKS } from "./stocks";

export const STARTING_CASH = 100000;
export const MATCH_DURATION_MS = 10 * 60 * 1000;

export type Trade = {
  id: string;
  ts: number;
  side: "BUY" | "SELL";
  symbol: string;
  qty: number;
  price: number;
};

export type Holding = { symbol: string; qty: number; avgPrice: number };

export type PlayerState = {
  id: string;
  name: string;
  avatar: string;
  cash: number;
  holdings: Holding[];
  trades: Trade[];
};

export type MatchStatus = "lobby" | "live" | "ended";

export type MatchState = {
  code: string;
  hostId: string;
  status: MatchStatus;
  startedAt: number | null;
  durationMs: number;
  players: Record<string, PlayerState>;
  // when ended
  winnerId?: string;
};

type Store = {
  matches: Record<string, MatchState>;
  current: string | null;
  setCurrent: (code: string | null) => void;
  createMatch: (host: { id: string; name: string; avatar: string }) => string;
  joinMatch: (code: string, player: { id: string; name: string; avatar: string }) => boolean;
  startMatch: (code: string) => void;
  endMatch: (code: string) => void;
  trade: (code: string, playerId: string, side: "BUY" | "SELL", symbol: string, qty: number) => string | null;
  ensureBot: (code: string) => void;
  tickBot: (code: string) => void;
};

function newPlayer(p: { id: string; name: string; avatar: string }): PlayerState {
  return { ...p, cash: STARTING_CASH, holdings: [], trades: [] };
}

function genCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export const useMatchStore = create<Store>()(
  persist(
    (set, get) => ({
  matches: {},
  current: null,
  setCurrent: (code) => set({ current: code }),
  createMatch: (host) => {
    const code = genCode();
    const m: MatchState = {
      code, hostId: host.id, status: "lobby", startedAt: null, durationMs: MATCH_DURATION_MS,
      players: { [host.id]: newPlayer(host) },
    };
    set((s) => ({ matches: { ...s.matches, [code]: m }, current: code }));
    return code;
  },
  joinMatch: (code, player) => {
    const m = get().matches[code];
    if (!m) return false;
    if (m.players[player.id]) { set({ current: code }); return true; }
    if (Object.keys(m.players).length >= 2) return false;
    const updated = { ...m, players: { ...m.players, [player.id]: newPlayer(player) } };
    set((s) => ({ matches: { ...s.matches, [code]: updated }, current: code }));
    return true;
  },
  startMatch: (code) => {
    const m = get().matches[code];
    if (!m) return;
    set((s) => ({ matches: { ...s.matches, [code]: { ...m, status: "live", startedAt: Date.now() } } }));
  },
  endMatch: (code) => {
    const m = get().matches[code];
    if (!m || m.status === "ended") return;
    let winnerId: string | undefined;
    let bestVal = -Infinity;
    for (const p of Object.values(m.players)) {
      const val = portfolioValue(p);
      if (val > bestVal) { bestVal = val; winnerId = p.id; }
    }
    set((s) => ({ matches: { ...s.matches, [code]: { ...m, status: "ended", winnerId } } }));
  },
  trade: (code, playerId, side, symbol, qty) => {
    const m = get().matches[code];
    if (!m || m.status !== "live") return "Match not live";
    const p = m.players[playerId];
    if (!p) return "Player missing";
    if (qty <= 0) return "Invalid quantity";
    const price = currentPrice(symbol);
    const cost = price * qty;
    let np: PlayerState;
    if (side === "BUY") {
      if (cost > p.cash) return "Insufficient cash";
      const existing = p.holdings.find((h) => h.symbol === symbol);
      const newHoldings = existing
        ? p.holdings.map((h) => h.symbol === symbol
            ? { ...h, qty: h.qty + qty, avgPrice: (h.avgPrice * h.qty + cost) / (h.qty + qty) }
            : h)
        : [...p.holdings, { symbol, qty, avgPrice: price }];
      np = { ...p, cash: p.cash - cost, holdings: newHoldings };
    } else {
      const existing = p.holdings.find((h) => h.symbol === symbol);
      if (!existing || existing.qty < qty) return "Not enough holdings";
      const newHoldings = existing.qty === qty
        ? p.holdings.filter((h) => h.symbol !== symbol)
        : p.holdings.map((h) => h.symbol === symbol ? { ...h, qty: h.qty - qty } : h);
      np = { ...p, cash: p.cash + cost, holdings: newHoldings };
    }
    const trade: Trade = { id: crypto.randomUUID(), ts: Date.now(), side, symbol, qty, price };
    np = { ...np, trades: [trade, ...np.trades] };
    set((s) => ({ matches: { ...s.matches, [code]: { ...m, players: { ...m.players, [playerId]: np } } } }));
    return null;
  },
  ensureBot: (code) => {
    const m = get().matches[code];
    if (!m) return;
    if (Object.keys(m.players).length >= 2) return;
    const bot = { id: "bot:" + code, name: "MarketBot", avatar: "#7c3aed" };
    get().joinMatch(code, bot);
  },
  tickBot: (code) => {
    const m = get().matches[code];
    if (!m || m.status !== "live") return;
    const botId = "bot:" + code;
    const bot = m.players[botId];
    if (!bot) return;
    // 30% chance to act
    if (Math.random() > 0.3) return;
    const sym = STOCKS[Math.floor(Math.random() * STOCKS.length)].symbol;
    const price = currentPrice(sym);
    const willSell = bot.holdings.length > 0 && Math.random() < 0.4;
    if (willSell) {
      const h = bot.holdings[Math.floor(Math.random() * bot.holdings.length)];
      const q = Math.max(1, Math.floor(h.qty * (0.3 + Math.random() * 0.7)));
      get().trade(code, botId, "SELL", h.symbol, q);
    } else {
      const maxQty = Math.floor((bot.cash * 0.2) / price);
      if (maxQty < 1) return;
      const q = Math.max(1, Math.floor(maxQty * Math.random()));
      get().trade(code, botId, "BUY", sym, q);
    }
  },
}),
    {
      name: "tl:matches",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as Storage)
      ),
      // Only persist matches map and current code — functions are re-created
      partialize: (s) => ({ matches: s.matches, current: s.current }),
    }
  )
);

export function portfolioValue(p: PlayerState): number {
  let v = p.cash;
  for (const h of p.holdings) v += currentPrice(h.symbol) * h.qty;
  return v;
}

export function pnl(p: PlayerState): number {
  return portfolioValue(p) - STARTING_CASH;
}
