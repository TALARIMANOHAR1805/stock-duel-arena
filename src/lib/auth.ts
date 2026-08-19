import { create } from "zustand";
import { persist } from "zustand/middleware";

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  xp: number;
  wins: number;
  losses: number;
  totalProfit: number;
  createdAt: number;
};

type AuthState = {
  user: User | null;
  signup: (name: string, email: string, password: string) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addResult: (won: boolean, profit: number, xp: number) => void;
};

const palette = ["#00ff88", "#ff3b3b", "#7c3aed", "#f59e0b", "#06b6d4", "#ec4899"];
function avatarFor(seed: string) {
  const idx = Math.abs(seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % palette.length;
  return palette[idx];
}

type StoredUser = User & { password: string };

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("sd:users") || "[]"); } catch { return []; }
}
function writeUsers(u: StoredUser[]) { if (typeof window === "undefined") return; localStorage.setItem("sd:users", JSON.stringify(u)); }

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      signup: (name, email, password) => {
        const users = readUsers();
        if (users.some((u) => u.email === email)) throw new Error("Email already registered");
        const user: StoredUser = {
          id: crypto.randomUUID(),
          name, email, password,
          avatar: avatarFor(email),
          xp: 0, wins: 0, losses: 0, totalProfit: 0,
          createdAt: Date.now(),
        };
        users.push(user);
        writeUsers(users);
        const { password: _, ...pub } = user;
        set({ user: pub });
      },
      login: (email, password) => {
        const u = readUsers().find((x) => x.email === email && x.password === password);
        if (!u) return false;
        const { password: _, ...pub } = u;
        set({ user: pub });
        return true;
      },
      logout: () => set({ user: null }),
      addResult: (won, profit, xp) => {
        const cur = get().user;
        if (!cur) return;
        const updated: User = {
          ...cur,
          xp: cur.xp + xp,
          wins: cur.wins + (won ? 1 : 0),
          losses: cur.losses + (won ? 0 : 1),
          totalProfit: cur.totalProfit + profit,
        };
        set({ user: updated });
        const users = readUsers();
        const idx = users.findIndex((u) => u.id === cur.id);
        if (idx >= 0) { users[idx] = { ...users[idx], ...updated }; writeUsers(users); }
      },
    }),
    { name: "sd:auth" }
  )
);

export function getLeaderboard(): User[] {
  return readUsers()
    .map(({ password: _p, ...u }) => u)
    .sort((a, b) => b.totalProfit - a.totalProfit);
}
