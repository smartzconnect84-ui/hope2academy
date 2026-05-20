import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, GraduationCap, Menu, X } from "lucide-react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/team", label: "Team" },
  { to: "/departments", label: "Departments" },
  { to: "/projects", label: "Projects" },
  { to: "/stories", label: "Stories" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="inline-flex h-9 w-9 rounded-full bg-primary text-primary-foreground items-center justify-center">
              <Heart className="h-4 w-4 fill-secondary text-secondary" />
            </span>
            <span>HOPE<span className="text-secondary">2</span>-LIBERIA</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-7">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`text-sm font-medium transition-colors ${pathname === n.to ? "text-primary" : "text-foreground/70 hover:text-foreground"}`}
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/get-involved"
              className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-2.5 text-sm font-semibold hover:brightness-95 transition shadow-[var(--shadow-soft)]"
            >
              <GraduationCap className="h-4 w-4" /> School Portal
            </Link>
          </nav>
          <button
            className="lg:hidden p-2"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="lg:hidden border-t border-border bg-background">
            <div className="container mx-auto px-6 py-4 flex flex-col gap-3">
              {nav.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="text-foreground/80">
                  {n.label}
                </Link>
              ))}
              <Link to="/get-involved" onClick={() => setOpen(false)} className="text-primary font-semibold">
                Get Involved
              </Link>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 py-16 grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-xl">
              <Heart className="h-5 w-5 fill-accent text-accent" />
              HOPE<span className="text-accent">2</span>-LIBERIA
            </div>
            <p className="mt-4 text-primary-foreground/80 max-w-md">
              A movement of compassion across Liberia — walking with communities as they rebuild stronger than before.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-accent">Explore</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              {nav.slice(1).map((n) => (
                <li key={n.to}><Link to={n.to}>{n.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-accent">Contact</h4>
            <p className="text-sm text-primary-foreground/80">
              Sinkor, Tubman Boulevard<br />Monrovia, Liberia<br />info@hope2liberia.org
            </p>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 py-6 text-center text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} HOPE2-LIBERIA. Built with hope.
        </div>
      </footer>
    </div>
  );
}