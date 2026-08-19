import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";

export function Nav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-bold tracking-tighter text-xl">TRADE LEARN</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/leaderboard" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">Leaderboard</Link>
          {user && <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">Dashboard</Link>}
          {user && <Link to="/portfolio" className="text-sm font-medium hover:text-primary transition-colors hidden md:block">Portfolio</Link>}
          <div className="h-4 w-px bg-border hidden sm:block" />
          {user ? (
            <>
              <Link to="/profile" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                <span className="size-7 rounded-sm flex items-center justify-center font-bold text-background" style={{ background: user.avatar }}>
                  {user.name[0]?.toUpperCase()}
                </span>
                <span className="hidden sm:inline">{user.name}</span>
              </Link>
              <button onClick={() => { logout(); nav({ to: "/" }); }} className="text-xs font-mono text-muted hover:text-danger">LOGOUT</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium">Login</Link>
              <Link to="/signup" className="bg-foreground text-background px-4 py-2 text-sm font-bold rounded-sm hover:bg-primary transition-colors">START DUEL</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
