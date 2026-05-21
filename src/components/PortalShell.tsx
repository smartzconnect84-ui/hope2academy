import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuth, ROLE_LABEL, type AppRole } from "@/hooks/use-auth";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar, Heart,
  LogOut, Settings, Bell, Award, FileText, UserCog, Shield,
  Image as ImageIcon, Newspaper, MessageSquare, ClipboardList,
  DollarSign, Briefcase, Library, BarChart3, FolderTree, Megaphone,
} from "lucide-react";
import { type ReactNode } from "react";
import { toast } from "sonner";

type NavItem = { to?: string; label: string; icon: any; soon?: boolean };
type NavGroup = { group: string; items: NavItem[] };

const navByRole: Record<AppRole, NavGroup[]> = {
  superadmin: [
    { group: "Overview", items: [
      { to: "/portal/superadmin", label: "Dashboard", icon: Shield },
      { to: "/portal/admin", label: "User Management", icon: Users },
      { label: "Analytics", icon: BarChart3, soon: true },
    ]},
    { group: "Content", items: [
      { label: "Pages (CMS)", icon: FileText, soon: true },
      { label: "Posts & Stories", icon: Newspaper, soon: true },
      { label: "Media Library", icon: ImageIcon, soon: true },
      { label: "Site Settings", icon: Settings, soon: true },
    ]},
    { group: "Operations", items: [
      { label: "Departments", icon: FolderTree, soon: true },
      { label: "Announcements", icon: Megaphone, soon: true },
      { label: "Audit Logs", icon: ClipboardList, soon: true },
    ]},
  ],
  admin: [
    { group: "Overview", items: [
      { to: "/portal/admin", label: "Dashboard", icon: LayoutDashboard },
      { to: "/portal/admin", label: "User Management", icon: Users },
    ]},
    { group: "Academics", items: [
      { label: "Classes & Grades", icon: GraduationCap, soon: true },
      { label: "Timetable", icon: Calendar, soon: true },
      { label: "Attendance", icon: ClipboardList, soon: true },
    ]},
    { group: "Content", items: [
      { label: "Stories & News", icon: Newspaper, soon: true },
      { label: "Media Library", icon: ImageIcon, soon: true },
    ]},
    { group: "Community", items: [
      { label: "Announcements", icon: Megaphone, soon: true },
      { label: "Messages", icon: MessageSquare, soon: true },
    ]},
  ],
  teacher: [
    { group: "Teaching", items: [
      { to: "/portal/teacher", label: "Dashboard", icon: LayoutDashboard },
      { label: "My Classes", icon: BookOpen, soon: true },
      { label: "Lesson Plans", icon: FileText, soon: true },
      { label: "Assignments", icon: ClipboardList, soon: true },
      { label: "Grade Book", icon: Award, soon: true },
      { label: "Attendance", icon: Calendar, soon: true },
    ]},
    { group: "Community", items: [
      { label: "Messages", icon: MessageSquare, soon: true },
      { label: "Resources", icon: Library, soon: true },
    ]},
  ],
  student: [
    { group: "Learning", items: [
      { to: "/portal/student", label: "Dashboard", icon: LayoutDashboard },
      { label: "My Courses", icon: BookOpen, soon: true },
      { label: "Assignments", icon: ClipboardList, soon: true },
      { label: "Grades & Reports", icon: Award, soon: true },
      { label: "Timetable", icon: Calendar, soon: true },
      { label: "Library", icon: Library, soon: true },
    ]},
    { group: "Life", items: [
      { label: "Announcements", icon: Megaphone, soon: true },
      { label: "Messages", icon: MessageSquare, soon: true },
    ]},
  ],
  parent: [
    { group: "My Family", items: [
      { to: "/portal/parent", label: "Dashboard", icon: LayoutDashboard },
      { label: "Children", icon: Heart, soon: true },
      { label: "Grades & Progress", icon: Award, soon: true },
      { label: "Attendance", icon: Calendar, soon: true },
      { label: "Fees & Donations", icon: DollarSign, soon: true },
    ]},
    { group: "Community", items: [
      { label: "Announcements", icon: Megaphone, soon: true },
      { label: "Messages", icon: MessageSquare, soon: true },
    ]},
  ],
  alumni: [
    { group: "Network", items: [
      { to: "/portal/alumni", label: "Dashboard", icon: LayoutDashboard },
      { label: "Alumni Directory", icon: Users, soon: true },
      { label: "Events & Reunions", icon: Calendar, soon: true },
      { label: "Job Board", icon: Briefcase, soon: true },
      { label: "Mentorship", icon: Heart, soon: true },
    ]},
    { group: "Give Back", items: [
      { label: "Donations", icon: DollarSign, soon: true },
      { label: "Stories", icon: Newspaper, soon: true },
    ]},
  ],
};

export function PortalShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const { profile, primaryRole, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const groups = primaryRole ? navByRole[primaryRole] : [];

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-muted/30">
      <div className="container mx-auto px-4 py-8 grid lg:grid-cols-[260px_1fr] gap-6">
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:sticky lg:top-24 lg:self-start"
        >
          <div className="rounded-2xl bg-card border border-border p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-bold">
                {(profile?.full_name ?? profile?.email ?? "U").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{profile?.full_name ?? "User"}</p>
                <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {primaryRole ? ROLE_LABEL[primaryRole] : "—"}
                </span>
              </div>
            </div>

            <nav className="mt-6 space-y-5 max-h-[60vh] overflow-y-auto pr-1">
              {groups.map((g) => (
                <div key={g.group}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-3 mb-1.5">{g.group}</p>
                  <div className="space-y-0.5">
                    {g.items.map((it, idx) => {
                      const Icon = it.icon;
                      const active = it.to && pathname === it.to;
                      const classes = `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        active
                          ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                          : "text-foreground/70 hover:bg-muted hover:text-foreground"
                      }`;
                      if (it.to && !it.soon) {
                        return (
                          <Link key={`${g.group}-${idx}`} to={it.to} className={classes}>
                            <Icon className="h-4 w-4" /> <span className="flex-1">{it.label}</span>
                          </Link>
                        );
                      }
                      return (
                        <button
                          key={`${g.group}-${idx}`}
                          onClick={() => toast.info(`${it.label} — coming soon`)}
                          className={`${classes} w-full text-left`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="flex-1">{it.label}</span>
                          <span className="text-[9px] uppercase tracking-wider opacity-60">Soon</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-3 mb-1.5">Account</p>
                <Link to="/portal/profile" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${pathname === "/portal/profile" ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted"}`}>
                  <UserCog className="h-4 w-4" /> My Profile
                </Link>
              </div>
            </nav>

            <button
              onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium hover:bg-secondary hover:text-secondary-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </motion.aside>

        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold">{title}</h1>
              {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="hidden md:flex items-center gap-2">
              <button className="h-10 w-10 rounded-full bg-card border border-border grid place-items-center hover:bg-muted"><Bell className="h-4 w-4" /></button>
              <button className="h-10 w-10 rounded-full bg-card border border-border grid place-items-center hover:bg-muted"><Settings className="h-4 w-4" /></button>
            </div>
          </div>
          {children}
        </motion.main>
      </div>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, delta, accent = "primary" }: { icon: any; label: string; value: string | number; delta?: string; accent?: "primary" | "secondary" | "accent" }) {
  const bg = accent === "secondary" ? "bg-secondary/10 text-secondary" : accent === "accent" ? "bg-accent/20 text-accent-foreground" : "bg-primary/10 text-primary";
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="rounded-2xl bg-card border border-border p-5 shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-start justify-between">
        <div className={`h-10 w-10 rounded-xl grid place-items-center ${bg}`}><Icon className="h-5 w-5" /></div>
        {delta && <span className="text-xs font-semibold text-primary">{delta}</span>}
      </div>
      <p className="mt-4 text-3xl font-bold font-display">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
}

export { FileText, Calendar, Users, BookOpen, GraduationCap, Heart, Award };