import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, ROLE_LABEL, type AppRole } from "@/hooks/use-auth";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar, Heart,
  LogOut, Settings, Bell, Award, FileText, UserCog, Shield,
  Image as ImageIcon, Newspaper, MessageSquare, ClipboardList,
  DollarSign, Briefcase, Library, BarChart3, FolderTree, Megaphone,
  ListTree,
} from "lucide-react";
import { type ReactNode } from "react";
import {
  Sidebar, SidebarProvider, SidebarTrigger, SidebarContent, SidebarHeader,
  SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = { to: string; label: string; icon: any };
type NavGroup = { group: string; items: NavItem[] };

const m = (key: string) => `/portal/m/${key}`;

const navByRole: Record<AppRole, NavGroup[]> = {
  superadmin: [
    { group: "Overview", items: [
      { to: "/portal/superadmin", label: "Dashboard", icon: Shield },
      { to: "/portal/admin", label: "User Management", icon: Users },
      { to: m("analytics"), label: "Analytics", icon: BarChart3 },
    ]},
    { group: "Content", items: [
      { to: m("pages"), label: "Pages (CMS)", icon: FileText },
      { to: m("posts"), label: "Posts & Stories", icon: Newspaper },
      { to: m("media"), label: "Media Library", icon: ImageIcon },
      { to: m("navigation"), label: "Navigation", icon: ListTree },
      { to: m("settings"), label: "Site Settings", icon: Settings },
    ]},
    { group: "Operations", items: [
      { to: m("departments"), label: "Departments", icon: FolderTree },
      { to: m("announcements"), label: "Announcements", icon: Megaphone },
      { to: m("audit"), label: "Audit Logs", icon: ClipboardList },
    ]},
  ],
  admin: [
    { group: "Overview", items: [
      { to: "/portal/admin", label: "Dashboard", icon: LayoutDashboard },
      { to: "/portal/admin", label: "User Management", icon: Users },
    ]},
    { group: "Academics", items: [
      { to: m("classes"), label: "Classes", icon: GraduationCap },
      { to: m("timetable"), label: "Timetable", icon: Calendar },
      { to: m("attendance"), label: "Attendance", icon: ClipboardList },
      { to: m("grades"), label: "Grades", icon: Award },
    ]},
    { group: "Content", items: [
      { to: m("posts"), label: "Stories & News", icon: Newspaper },
      { to: m("media"), label: "Media Library", icon: ImageIcon },
    ]},
    { group: "Community", items: [
      { to: m("announcements"), label: "Announcements", icon: Megaphone },
      { to: m("messages"), label: "Messages", icon: MessageSquare },
    ]},
  ],
  teacher: [
    { group: "Teaching", items: [
      { to: "/portal/teacher", label: "Dashboard", icon: LayoutDashboard },
      { to: m("classes"), label: "My Classes", icon: BookOpen },
      { to: m("assignments"), label: "Assignments", icon: ClipboardList },
      { to: m("grades"), label: "Grade Book", icon: Award },
      { to: m("attendance"), label: "Attendance", icon: Calendar },
      { to: m("timetable"), label: "Timetable", icon: Calendar },
    ]},
    { group: "Community", items: [
      { to: m("messages"), label: "Messages", icon: MessageSquare },
      { to: m("resources"), label: "Resources", icon: Library },
    ]},
  ],
  student: [
    { group: "Learning", items: [
      { to: "/portal/student", label: "Dashboard", icon: LayoutDashboard },
      { to: m("classes"), label: "My Courses", icon: BookOpen },
      { to: m("assignments"), label: "Assignments", icon: ClipboardList },
      { to: m("grades"), label: "Grades & Reports", icon: Award },
      { to: m("timetable"), label: "Timetable", icon: Calendar },
      { to: m("library"), label: "Library", icon: Library },
    ]},
    { group: "Life", items: [
      { to: m("announcements"), label: "Announcements", icon: Megaphone },
      { to: m("messages"), label: "Messages", icon: MessageSquare },
    ]},
  ],
  parent: [
    { group: "My Family", items: [
      { to: "/portal/parent", label: "Dashboard", icon: LayoutDashboard },
      { to: m("children"), label: "Children", icon: Heart },
      { to: m("grades"), label: "Grades & Progress", icon: Award },
      { to: m("attendance"), label: "Attendance", icon: Calendar },
      { to: m("fees"), label: "Fees & Donations", icon: DollarSign },
    ]},
    { group: "Community", items: [
      { to: m("announcements"), label: "Announcements", icon: Megaphone },
      { to: m("messages"), label: "Messages", icon: MessageSquare },
    ]},
  ],
  alumni: [
    { group: "Network", items: [
      { to: "/portal/alumni", label: "Dashboard", icon: LayoutDashboard },
      { to: m("directory"), label: "Alumni Directory", icon: Users },
      { to: m("events"), label: "Events & Reunions", icon: Calendar },
      { to: m("jobs"), label: "Job Board", icon: Briefcase },
      { to: m("mentorship"), label: "Mentorship", icon: Heart },
    ]},
    { group: "Give Back", items: [
      { to: m("donations"), label: "Donations", icon: DollarSign },
      { to: m("posts"), label: "Stories", icon: Newspaper },
    ]},
  ],
};

export function PortalShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const { profile, primaryRole, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const groups = primaryRole ? navByRole[primaryRole] : [];

  return (
    <SidebarProvider>
      <div className="flex min-h-[calc(100vh-5rem)] w-full bg-muted/30">
        <Sidebar collapsible="icon" className="top-20 !h-[calc(100svh-5rem)]">
          <SidebarHeader>
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-bold">
                {(profile?.full_name ?? profile?.email ?? "U").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="font-semibold truncate text-sm">{profile?.full_name ?? "User"}</p>
                <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {primaryRole ? ROLE_LABEL[primaryRole] : "—"}
                </span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            {groups.map((g) => (
              <SidebarGroup key={g.group}>
                <SidebarGroupLabel>{g.group}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {g.items.map((it, idx) => {
                      const Icon = it.icon;
                      const active = pathname === it.to;
                      return (
                        <SidebarMenuItem key={`${g.group}-${idx}`}>
                          <SidebarMenuButton asChild isActive={active} tooltip={it.label}>
                            <Link to={it.to}>
                              <Icon className="h-4 w-4" />
                              <span>{it.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
            <SidebarGroup>
              <SidebarGroupLabel>Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/portal/profile"} tooltip="My Profile">
                      <Link to="/portal/profile">
                        <UserCog className="h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarSeparator />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Sign out"
                  onClick={async () => { await signOut(); navigate("/"); }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-20 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 backdrop-blur px-4">
            <SidebarTrigger />
            <div className="h-5 w-px bg-border mx-1" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-semibold">{title}</p>
            </div>
            <button className="h-9 w-9 rounded-full bg-card border border-border grid place-items-center hover:bg-muted"><Bell className="h-4 w-4" /></button>
            <button className="hidden sm:grid h-9 w-9 rounded-full bg-card border border-border place-items-center hover:bg-muted"><Settings className="h-4 w-4" /></button>
          </header>

          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8"
          >
            <div className="mb-6">
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold">{title}</h1>
              {subtitle && <p className="mt-1 text-sm sm:text-base text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
          </motion.main>
        </div>
      </div>
    </SidebarProvider>
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