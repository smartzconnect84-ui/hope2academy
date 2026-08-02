
import { useEffect, useState } from "react";
import { Award, Users, Briefcase, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { PortalShell, StatCard } from "@/components/PortalShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Reveal, StaggerGroup } from "@/components/Motion";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { mockDb } from "@/lib/mock-backend";

interface AlumniStats {
  jobListings?: number;
  upcomingEvents?: number;
  donations?: number;
  scholarships?: number;
  graduationYear?: string | number;
}

function AlumniPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AlumniStats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await apiClient.getStats() as AlumniStats;
        setStats(s);
      } catch {
        // Fall back to mock data counts
        const jobs   = mockDb.list("jobs");
        const events = mockDb.list("events");
        setStats({ jobListings: jobs.length, upcomingEvents: events.length });
      }
    })();
  }, []);

  const classOf = profile?.graduation_year ?? stats?.graduationYear;

  return (
    <PortalShell title="Alumni Portal" subtitle={classOf ? `Class of ${classOf}` : "Stay connected with HOPE2 ACADEMY"}>
      <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}    label="Alumni Network"  value={stats?.scholarships ?? "—"} />
        <StatCard icon={Calendar} label="Upcoming Events"  value={stats?.upcomingEvents ?? "—"} accent="accent" />
        <StatCard icon={Briefcase} label="Job Board"       value={stats?.jobListings ?? "—"} accent="secondary" />
        <StatCard icon={Award}    label="My Donations"    value={stats?.donations ?? 0} />
      </StaggerGroup>

      <Reveal className="mt-8 grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]">
          <h3 className="font-display text-xl font-semibold">Give back</h3>
          <p className="mt-2 text-sm text-muted-foreground">Mentor a current student, sponsor a scholarship, or share your story with the next generation.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/portal/m/mentorship"
              className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
            >
              Become a mentor
            </Link>
            <Link
              to="/portal/m/donations"
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary transition"
            >
              Sponsor a child
            </Link>
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-accent to-primary text-primary-foreground p-6">
          <h3 className="font-display text-xl font-semibold">Upcoming alumni events</h3>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/90">
            <li>· Monrovia mixer — Aug 12</li>
            <li>· Annual reunion — Dec 21</li>
            <li>· Career fair — Jan 14</li>
          </ul>
          <Link
            to="/portal/m/events"
            className="mt-4 inline-block text-xs font-semibold underline underline-offset-2 text-primary-foreground/80 hover:text-primary-foreground transition"
          >
            View all events →
          </Link>
        </div>
      </Reveal>

      <Reveal className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3" delay={0.1}>
        {[
          { label: "Job Board", to: "/portal/m/jobs" },
          { label: "Directory", to: "/portal/m/directory" },
          { label: "My Donations", to: "/portal/m/donations" },
        ].map(({ label, to }) => (
          <Link
            key={label}
            to={to}
            className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-left hover:border-primary hover:text-primary transition"
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
    <RequireAuth allow={["alumni","superadmin"]}>
      <AlumniPage />
    </RequireAuth>
  );
}

export default RouteComponent;
