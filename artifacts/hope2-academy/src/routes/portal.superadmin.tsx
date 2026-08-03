
import { useEffect, useState } from "react";
import { Shield, Users, GraduationCap, Database, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { PortalShell, StatCard } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { apiClient } from "@/lib/api-client";
import { mockAuth } from "@/lib/mock-backend";
import { StaggerGroup, Reveal } from "@/components/Motion";

const GOVERNANCE_ITEMS: Array<{ label: string; to?: string; soon?: boolean }> = [
  { label: "Audit Logs",          to: "/portal/m/audit" },
  { label: "Org Settings",        to: "/portal/m/settings" },
  { label: "Module Access Control", to: "/portal/m/moduleaccess" },
  { label: "Human Resources",     to: "/portal/m/staff" },
  { label: "Finance",             to: "/portal/m/finance" },
  { label: "Analytics",           to: "/portal/m/analytics" },
  { label: "Backups",             soon: true },
];

function SuperAdminPage() {
  const [counts, setCounts] = useState({ users: 0, roles: 0 });
  useEffect(() => {
    (async () => {
      try {
        const all = await apiClient.listUsers();
        setCounts({ users: all.length, roles: all.length });
      } catch {
        const all = await mockAuth.listUsers();
        setCounts({ users: all.length, roles: all.length });
      }
    })();
  }, []);

  return (
    <PortalShell title="Super Admin" subtitle="Full system oversight and governance">
      <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}         label="Total Users"      value={counts.users} delta="+ live" />
        <StatCard icon={Shield}        label="Role Assignments"  value={counts.roles} accent="accent" />
        <StatCard icon={GraduationCap} label="Active Schools"   value={4}            accent="secondary" />
        <StatCard icon={Database}      label="System Health"    value="100%" />
      </StaggerGroup>

      <Reveal className="mt-8 rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Governance</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          As Super Admin you can create administrators, transfer ownership, view audit trails and configure org-wide policies.
        </p>
        <div className="mt-5 grid sm:grid-cols-3 gap-3">
          {GOVERNANCE_ITEMS.map(({ label, to, soon }) =>
            to ? (
              <Link
                key={label}
                to={to}
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-left hover:border-primary hover:text-primary transition"
              >
                {label}
              </Link>
            ) : (
              <button
                key={label}
                onClick={() => alert(`${label} — coming soon`)}
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-left hover:border-primary hover:text-primary transition opacity-60 cursor-not-allowed"
                title="Coming soon"
              >
                {label}
                <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">soon</span>
              </button>
            )
          )}
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground mb-3">Quick user management</p>
          <div className="flex flex-wrap gap-2">
            <Link to="/portal/admin" className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary transition">
              Manage Users
            </Link>
            <Link to="/portal/m/admissions" className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary transition">
              Admissions
            </Link>
            <Link to="/portal/m/announcements" className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary transition">
              Announcements
            </Link>
            <Link to="/portal/m/broadcast" className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary transition">
              Broadcast
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal className="mt-6 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground p-6">
        <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /><h3 className="font-display text-lg font-semibold">This week</h3></div>
        <p className="mt-2 text-primary-foreground/90">All systems nominal. Schedule a board sync to review pillar metrics.</p>
        <Link to="/portal/m/analytics" className="mt-3 inline-block text-xs font-semibold underline underline-offset-2 text-primary-foreground/80 hover:text-primary-foreground transition">
          View analytics →
        </Link>
      </Reveal>
    </PortalShell>
  );
}

function RouteComponent() {
  return (
    <RequireAuth allow={["superadmin"]}>
      <SuperAdminPage />
    </RequireAuth>
  );
}

export default RouteComponent;
