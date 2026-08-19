import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!login(email.trim(), password)) {
      setErr("Invalid email or password.");
      return;
    }
    nav({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid-bg flex flex-col items-center justify-center px-6 py-12">
      <Link to="/" className="flex items-center gap-2 mb-10"><Logo /><span className="font-bold tracking-tighter text-xl">TRADE LEARN</span></Link>
      <div className="w-full max-w-md bg-surface border border-border p-8 rounded-md">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">LOG IN</h1>
        <p className="text-sm text-muted-foreground mb-6 font-mono">Enter the arena.</p>
        <form onSubmit={submit} className="space-y-4">
          <Field label="EMAIL" type="email" value={email} onChange={setEmail} />
          <Field label="PASSWORD" type="password" value={password} onChange={setPassword} />
          {err && <p className="text-xs text-danger font-mono">{err}</p>}
          <button type="submit" className="w-full h-12 bg-primary text-background font-bold rounded-sm hover:shadow-[0_0_24px_rgba(0,255,136,0.35)] transition-all">LOGIN</button>
        </form>
        <p className="text-xs text-muted-foreground mt-6 text-center font-mono">
          NEW HERE? <Link to="/signup" className="text-primary hover:underline">CREATE ACCOUNT</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono text-muted-foreground tracking-widest">{label}</span>
      <input
        type={type} required value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 bg-background border border-border rounded-sm px-3 py-3 font-mono text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
