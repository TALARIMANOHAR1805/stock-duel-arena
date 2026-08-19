import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const nav = useNavigate();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      if (name.trim().length < 2) throw new Error("Name too short");
      if (password.length < 6) throw new Error("Password must be at least 6 characters");
      signup(name.trim(), email.trim().toLowerCase(), password);
      nav({ to: "/dashboard" });
    } catch (e: any) { setErr(e.message); }
  };

  return (
    <div className="min-h-screen grid-bg flex flex-col items-center justify-center px-6 py-12">
      <Link to="/" className="flex items-center gap-2 mb-10"><Logo /><span className="font-bold tracking-tighter text-xl">TRADE LEARN</span></Link>
      <div className="w-full max-w-md bg-surface border border-border p-8 rounded-md">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">CREATE ACCOUNT</h1>
        <p className="text-sm text-muted-foreground mb-6 font-mono">₹1,00,000 virtual capital awaits.</p>
        <form onSubmit={submit} className="space-y-4">
          <Field label="DISPLAY NAME" type="text" value={name} onChange={setName} />
          <Field label="EMAIL" type="email" value={email} onChange={setEmail} />
          <Field label="PASSWORD" type="password" value={password} onChange={setPassword} />
          {err && <p className="text-xs text-danger font-mono">{err}</p>}
          <button type="submit" className="w-full h-12 bg-primary text-background font-bold rounded-sm hover:shadow-[0_0_24px_rgba(0,255,136,0.35)] transition-all">START TRADING</button>
        </form>
        <p className="text-xs text-muted-foreground mt-6 text-center font-mono">
          ALREADY DUELING? <Link to="/login" className="text-primary hover:underline">LOG IN</Link>
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
