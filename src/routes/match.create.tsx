import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useMatchStore } from "@/lib/match";

export const Route = createFileRoute("/match/create")({ component: CreateMatch });

function CreateMatch() {
  const nav = useNavigate();
  const { user } = useAuth();
  const create = useMatchStore((s) => s.createMatch);
  const created = useRef(false);

  useEffect(() => {
    if (!user) { nav({ to: "/login" }); return; }
    if (created.current) return;
    created.current = true;
    const code = create({ id: user.id, name: user.name, avatar: user.avatar });
    nav({ to: "/match/$code", params: { code }, replace: true });
  }, [user, nav, create]);

  return (
    <div className="min-h-screen flex items-center justify-center grid-bg">
      <div className="font-mono text-muted-foreground">CREATING ARENA…</div>
    </div>
  );
}
