
import { useEffect, useState } from "react";
import { Heart, Users, Calendar, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { PortalShell, StatCard } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Reveal, StaggerGroup } from "@/components/Motion";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { mockDb } from "@/lib/mock-backend";

interface ParentStats {
  children?: Array<{ name: string; grades: unknown[]; fees: unknown[] }>;
  upcomingEvents?: number;
  outstandingFees?: number;
}

interface Announcement { id: string; title: string; body: string; audience: string; }

function ParentPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<ParentStats | null>(null);
  const [updates, setUpdates] = useState<Announcement[]>([]);

  useEffect(() => {
    (async () => {
      // Fetch dashboard stats
      try {
        const s = await apiClient.getStats() as ParentStats;
        setStats(s);
      } catch { /* use fallback child count from profile */ }

      // Fetch announcements — real API first, then mock
      try {
        const all = await apiClient.list<Announcement>("announcements");
        const forParents = all.filter((a) =>
          !a.audience || a.audience === "All" || a.audience === "Parents"
        );
        setUpdates(forParents.slice(0, 3));
      } catch {
        const all = mockDb.list<Announcement>("announcements");
        const forParents = all.filter((a) =>
          !a.audience || a.audience === "All" || a.audience === "Parents"
        );
        setUpdates(forParents.slice(0, 3));
      }
    })();
  }, []);

  const childCount = stats?.children?.length ?? profile?.linked_children?.length ?? 0;

  return (
    <PortalShell title="Parent Portal" subtitle="Follow your child's journey at HOPE2 ACADEMY">
      <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}         label="Children"       value={childCount || 1} />
        <StatCard icon={Calendar}      label="Next Event"     value={stats?.upcomingEvents ? `${stats.upcomingEvents} upcoming` : "PTA"} accent="accent" />
        <StatCard icon={MessageSquare} label="New Messages"   value={3}                accent="secondary" />
        <StatCard icon={Heart}         label="Account"        value="Active" />
      </StaggerGroup>

      <Reveal className="mt-8 rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold">Recent updates from school</h3>
          <Link to="/portal/m/announcements" className="text-xs text-primary font-semibold hover:underline">
            All notices →
          </Link>
        </div>
        {updates.length > 0 ? (
          <ul className="space-y-3">
            {updates.map((x) => (
              <li key={x.id} className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">{x.title}</p>
                {x.body && <p className="mt-1 text-muted-foreground text-xs line-clamp-2">{x.body}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-3">
            {[
              "Parent-Teacher meeting scheduled for Friday at 4pm",
              "Vaccination drive complete — all participants healthy",
              "New library books arrived in Marshall Road campus",
            ].map((x) => (
              <li key={x} className="rounded-xl bg-muted/50 px-4 py-3 text-sm">{x}</li>
            ))}
          </ul>
        )}
      </Reveal>

      {stats?.children && stats.children.length > 0 && (
        <Reveal className="mt-6 rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]" delay={0.1}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-semibold">My children</h3>
            <Link to="/portal/m/children" className="text-xs text-primary font-semibold hover:underline">
              Details →
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {stats.children.map((child) => (
              <li key={child.name} className="py-3 flex items-center justify-between">
                <span className="font-medium">{child.name}</span>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{child.grades.length} grades</span>
                  <span>{(child.fees as Array<{ status?: string }>).filter(f => f?.status === "Outstanding").length} outstanding fees</span>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      <Reveal className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3" delay={0.15}>
        {[
          { label: "Messages",     to: "/portal/m/messages" },
          { label: "Events",       to: "/portal/m/events" },
          { label: "Fees",         to: "/portal/m/fees" },
        ].map(({ label, to }) => (
          <Link
            key={label}
            to={to}
            className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:border-primary hover:text-primary transition"
          >
            {label} →
          </Link>
        ))}
      </Reveal>
    </PortalShell>
  );
}

function RouteComponent() {
  return (
    <RequireAuth allow={["parent","superadmin"]}>
      <ParentPage />
    </RequireAuth>
  );
}

export default RouteComponent;
