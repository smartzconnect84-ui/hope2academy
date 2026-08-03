import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, ROLE_LABEL, type AppRole } from "@/hooks/use-auth";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar, Heart,
  LogOut, Settings, Bell, Award, FileText, UserCog, Shield,
  Image as ImageIcon, Newspaper, MessageSquare, ClipboardList,
  DollarSign, Briefcase, Library, BarChart3, FolderTree, Megaphone,
  ListTree, Search as SearchIcon, CheckCircle2,
  Mail, Send, Wallet, Receipt, PieChart, FileSpreadsheet,
  Building2, Inbox, X,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Sidebar, SidebarProvider, SidebarTrigger, SidebarContent, SidebarHeader,
  SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem,
} from "@/components/ui/command";
import { mockDb } from "@/lib/mock-backend";
import { approvalsStore } from "@/lib/approvals";
import { Logo, BrandWordmark } from "@/components/Logo";

type NavItem = { to: string; label: string; icon: any };
type NavGroup = { group: string; items: NavItem[] };

const m = (key: string) => `/portal/m/${key}`;

const navByRole: Record<AppRole, NavGroup[]> = {
  superadmin: [
    { group: "Overview", items: [
      { to: "/portal/superadmin", label: "Dashboard", icon: Shield },
      { to: m("analytics"), label: "School Analytics", icon: BarChart3 },
      { to: m("audit"), label: "System Audit Log", icon: ClipboardList },
    ]},
    { group: "Approvals", items: [
      { to: m("approvals"), label: "Approvals Centre", icon: CheckCircle2 },
    ]},
    { group: "People & Roles", items: [
      { to: "/portal/admin", label: "User Management", icon: Users },
      { to: m("departments"), label: "Departments", icon: Building2 },
      { to: m("staff"), label: "Human Resources", icon: UserCog },
      { to: m("leaverequests"), label: "Staff Leave Management", icon: Inbox },
    ]},
    { group: "Admissions", items: [
      { to: m("admissions"), label: "Admissions Register", icon: ClipboardList },
      { to: m("scholarships"), label: "Scholarships & Financial Aid", icon: GraduationCap },
    ]},
    { group: "Academics", items: [
      { to: m("classes"), label: "Classes & Enrolment", icon: GraduationCap },
      { to: m("timetable"), label: "Timetable", icon: Calendar },
      { to: m("attendance"), label: "Attendance Register", icon: ClipboardList },
      { to: m("grades"), label: "Grade Book", icon: BookOpen },
      { to: m("assessments"), label: "Assessments", icon: CheckCircle2 },
      { to: m("submissions"), label: "Submissions Register", icon: Inbox },
      { to: m("gradesheet"), label: "Academic Transcripts", icon: FileSpreadsheet },
      { to: m("reportcard"), label: "Progress Reports", icon: Award },
      { to: m("behavior"), label: "Conduct Records", icon: Award },
      { to: m("lessonplans"), label: "Lesson Plans", icon: BookOpen },
      { to: m("library"), label: "Digital Library", icon: Library },
      { to: m("exams"), label: "Examinations", icon: FileText },
      { to: m("academicyear"), label: "Academic Year Setup", icon: Settings },
      { to: m("counselling"), label: "Counselling Records", icon: Heart },
      { to: m("bookstock"), label: "Library Catalogue", icon: Library },
      { to: m("ptmeetings"), label: "PTM Scheduler", icon: Users },
      { to: m("calendar"), label: "Academic Calendar", icon: Calendar },
    ]},
    { group: "Operations", items: [
      { to: m("transport"), label: "Transport", icon: FolderTree },
      { to: m("inventory"), label: "Asset Management", icon: FolderTree },
      { to: m("fees"), label: "Tuition & Fees", icon: DollarSign },
      { to: m("visitorlog"), label: "Visitor Log", icon: ClipboardList },
    ]},
    { group: "Health Services", items: [
      { to: m("clinic"), label: "Health Services", icon: Heart },
      { to: m("immunizations"), label: "Immunisation Records", icon: Heart },
      { to: m("medications"), label: "Medication Administration", icon: Heart },
      { to: m("healthalerts"), label: "Health Alerts", icon: Heart },
      { to: m("medicalscreenings"), label: "Health Screenings", icon: Heart },
    ]},
    { group: "Finance", items: [
      { to: m("finance"), label: "Finance Overview", icon: PieChart },
      { to: m("payroll"), label: "Payroll & Salaries", icon: Wallet },
      { to: m("expenses"), label: "Expenses & Payables", icon: Receipt },
    ]},
    { group: "Content Management", items: [
      { to: m("hero"), label: "Hero Banner", icon: ImageIcon },
      { to: m("homepage"), label: "Homepage Content", icon: ImageIcon },
      { to: m("team"), label: "Team Page", icon: Users },
      { to: m("projectspage"), label: "Projects Content", icon: FolderTree },
      { to: m("storiespage"), label: "Stories Content", icon: Newspaper },
      { to: m("divisionspage"), label: "Departments Content", icon: Building2 },
      { to: m("pages"), label: "Custom Pages", icon: FileText },
      { to: m("posts"), label: "News & Stories", icon: Newspaper },
      { to: m("media"), label: "Media Library", icon: ImageIcon },
      { to: m("navigation"), label: "Site Navigation", icon: ListTree },
    ]},
    { group: "Communications", items: [
      { to: m("announcements"), label: "Announcements", icon: Megaphone },
      { to: m("messages"), label: "Messages", icon: MessageSquare },
      { to: m("broadcast"), label: "Internal Broadcast", icon: Send },
      { to: m("campaigns"), label: "Email Campaigns", icon: Mail },
      { to: m("forms"), label: "Online Forms", icon: FileSpreadsheet },
    ]},
    { group: "Inbox", items: [
      { to: m("inquiries"), label: "Enquiries", icon: Inbox },
      { to: m("volunteers"), label: "Volunteer Sign-ups", icon: Users },
      { to: m("subscribers"), label: "Subscribers", icon: Send },
      { to: m("pledges"), label: "Pledges", icon: Heart },
    ]},
    { group: "Settings", items: [
      { to: m("settings"), label: "System Settings", icon: Settings },
      { to: m("moduleaccess"), label: "Module Access Control", icon: Shield },
    ]},
  ],
  admin: [
    { group: "Overview", items: [
      { to: "/portal/admin", label: "Dashboard", icon: LayoutDashboard },
      { to: m("analytics"), label: "School Analytics", icon: BarChart3 },
    ]},
    { group: "Approvals", items: [
      { to: m("approvals"), label: "Approvals Queue", icon: CheckCircle2 },
    ]},
    { group: "People & Roles", items: [
      { to: "/portal/admin", label: "User Management", icon: Users },
      { to: m("departments"), label: "Departments", icon: Building2 },
      { to: m("staff"), label: "Human Resources", icon: UserCog },
      { to: m("leaverequests"), label: "Staff Leave Management", icon: Inbox },
    ]},
    { group: "Admissions", items: [
      { to: m("admissions"), label: "Admissions Register", icon: ClipboardList },
      { to: m("scholarships"), label: "Scholarships & Financial Aid", icon: GraduationCap },
    ]},
    { group: "Academics", items: [
      { to: m("classes"), label: "Classes & Enrolment", icon: GraduationCap },
      { to: m("timetable"), label: "Timetable", icon: Calendar },
      { to: m("attendance"), label: "Attendance Register", icon: ClipboardList },
      { to: m("grades"), label: "Grade Book", icon: BookOpen },
      { to: m("assessments"), label: "Assessments", icon: CheckCircle2 },
      { to: m("submissions"), label: "Submissions Register", icon: Inbox },
      { to: m("gradesheet"), label: "Academic Transcripts", icon: FileSpreadsheet },
      { to: m("reportcard"), label: "Progress Reports", icon: Award },
      { to: m("behavior"), label: "Conduct Records", icon: Award },
      { to: m("lessonplans"), label: "Lesson Plans", icon: BookOpen },
      { to: m("library"), label: "Digital Library", icon: Library },
      { to: m("exams"), label: "Examinations", icon: FileText },
      { to: m("academicyear"), label: "Academic Year Setup", icon: Settings },
      { to: m("counselling"), label: "Counselling Records", icon: Heart },
      { to: m("bookstock"), label: "Library Catalogue", icon: Library },
      { to: m("ptmeetings"), label: "PTM Scheduler", icon: Users },
      { to: m("calendar"), label: "Academic Calendar", icon: Calendar },
    ]},
    { group: "Operations", items: [
      { to: m("transport"), label: "Transport", icon: FolderTree },
      { to: m("clinic"), label: "Health Services", icon: Heart },
      { to: m("inventory"), label: "Asset Management", icon: FolderTree },
      { to: m("visitorlog"), label: "Visitor Log", icon: ClipboardList },
    ]},
    { group: "Health Records", items: [
      { to: m("immunizations"), label: "Immunisation Records", icon: Heart },
      { to: m("medications"), label: "Medication Administration", icon: Heart },
      { to: m("healthalerts"), label: "Health Alerts", icon: Heart },
      { to: m("medicalscreenings"), label: "Health Screenings", icon: Heart },
    ]},
    { group: "Finance", items: [
      { to: m("fees"), label: "Tuition & Fees", icon: DollarSign },
    ]},
    { group: "Content Management", items: [
      { to: m("hero"), label: "Hero Banner", icon: ImageIcon },
      { to: m("homepage"), label: "Homepage Content", icon: ImageIcon },
      { to: m("team"), label: "Team Page", icon: Users },
      { to: m("projectspage"), label: "Projects Content", icon: FolderTree },
      { to: m("storiespage"), label: "Stories Content", icon: Newspaper },
      { to: m("divisionspage"), label: "Departments Content", icon: FolderTree },
      { to: m("posts"), label: "News & Stories", icon: Newspaper },
      { to: m("media"), label: "Media Library", icon: ImageIcon },
    ]},
    { group: "Communications", items: [
      { to: m("announcements"), label: "Announcements", icon: Megaphone },
      { to: m("messages"), label: "Messages", icon: MessageSquare },
      { to: m("broadcast"), label: "Internal Broadcast", icon: Send },
      { to: m("campaigns"), label: "Email Campaigns", icon: Mail },
      { to: m("forms"), label: "Online Forms", icon: FileSpreadsheet },
    ]},
    { group: "Inbox", items: [
      { to: m("inquiries"), label: "Enquiries", icon: Inbox },
      { to: m("volunteers"), label: "Volunteer Sign-ups", icon: Users },
      { to: m("subscribers"), label: "Subscribers", icon: Send },
      { to: m("pledges"), label: "Pledges", icon: Heart },
    ]},
    { group: "Settings", items: [
      { to: m("settings"), label: "System Settings", icon: Settings },
      { to: m("moduleaccess"), label: "Module Access Control", icon: Shield },
    ]},
  ],
  admin_assistant: [
    { group: "Overview", items: [
      { to: "/portal/admin_assistant", label: "Dashboard", icon: LayoutDashboard },
      { to: m("calendar"), label: "Academic Calendar", icon: Calendar },
      { to: m("announcements"), label: "Announcements", icon: Megaphone },
    ]},
    { group: "Communications", items: [
      { to: m("messages"), label: "Messages", icon: MessageSquare },
      { to: m("broadcast"), label: "Internal Broadcast", icon: Send },
      { to: m("campaigns"), label: "Email Campaigns", icon: Mail },
      { to: m("forms"), label: "Online Forms", icon: FileSpreadsheet },
    ]},
    { group: "Inbox", items: [
      { to: m("inquiries"), label: "Enquiries", icon: Inbox },
      { to: m("volunteers"), label: "Volunteer Sign-ups", icon: Users },
      { to: m("subscribers"), label: "Subscribers", icon: Send },
    ]},
    { group: "Records", items: [
      { to: m("staff"), label: "Staff Directory", icon: Users },
      { to: m("attendance"), label: "Attendance Register", icon: ClipboardList },
      { to: m("resources"), label: "Resources", icon: Library },
      { to: m("approvals"), label: "My Requests", icon: CheckCircle2 },
    ]},
    { group: "Operations", items: [
      { to: m("inventory"), label: "Asset Management", icon: FolderTree },
      { to: m("transport"), label: "Transport", icon: FolderTree },
      { to: m("clinic"), label: "Health Services", icon: Heart },
      { to: m("events"), label: "Events", icon: Calendar },
      { to: m("visitorlog"), label: "Visitor Log", icon: ClipboardList },
    ]},
  ],
  registrar: [
    { group: "Overview", items: [
      { to: "/portal/registrar", label: "Dashboard", icon: LayoutDashboard },
      { to: m("classes"), label: "Classes & Enrolment", icon: GraduationCap },
      { to: m("timetable"), label: "Timetable", icon: Calendar },
      { to: m("calendar"), label: "Academic Calendar", icon: Calendar },
    ]},
    { group: "Academic Records", items: [
      { to: m("grades"), label: "Grade Book", icon: BookOpen },
      { to: m("exams"), label: "Examinations", icon: FileText },
      { to: m("attendance"), label: "Attendance Register", icon: ClipboardList },
      { to: m("behavior"), label: "Conduct Records", icon: Award },
      { to: m("bookstock"), label: "Library Catalogue", icon: Library },
      { to: m("directory"), label: "School Directory", icon: Users },
      { to: m("approvals"), label: "My Requests", icon: CheckCircle2 },
    ]},
    { group: "Admissions", items: [
      { to: m("admissions"), label: "Admissions Register", icon: ClipboardList },
      { to: m("scholarships"), label: "Scholarships & Financial Aid", icon: Award },
    ]},
    { group: "Finance", items: [
      { to: m("finance"), label: "Finance Overview", icon: PieChart },
      { to: m("receipts"), label: "Payment Receipts", icon: Receipt },
      { to: m("fees"), label: "Tuition & Fees", icon: DollarSign },
      { to: m("donations"), label: "Donations", icon: Heart },
      { to: m("pledges"), label: "Pledges", icon: Heart },
      { to: m("payroll"), label: "Payroll & Salaries", icon: Wallet },
      { to: m("expenses"), label: "Expenses & Payables", icon: Receipt },
    ]},
    { group: "HR & Staff", items: [
      { to: m("leaverequests"), label: "Staff Leave Management", icon: Inbox },
    ]},
    { group: "Communications", items: [
      { to: m("announcements"), label: "Announcements", icon: Megaphone },
      { to: m("messages"), label: "Messages", icon: MessageSquare },
      { to: m("broadcast"), label: "Internal Broadcast", icon: Send },
    ]},
  ],
  admissions_officer: [
    { group: "Overview", items: [
      { to: "/portal/admissions_officer", label: "Dashboard", icon: LayoutDashboard },
      { to: m("admissions"), label: "Applications", icon: ClipboardList },
      { to: m("scholarships"), label: "Scholarships & Financial Aid", icon: Award },
      { to: m("classes"), label: "Class Capacity", icon: GraduationCap },
      { to: m("approvals"), label: "My Requests", icon: CheckCircle2 },
    ]},
    { group: "Engagement", items: [
      { to: m("messages"), label: "Messages", icon: MessageSquare },
      { to: m("broadcast"), label: "Internal Broadcast", icon: Send },
      { to: m("campaigns"), label: "Email Campaigns", icon: Mail },
      { to: m("forms"), label: "Online Forms", icon: FileSpreadsheet },
      { to: m("announcements"), label: "Announcements", icon: Megaphone },
      { to: m("events"), label: "Open Days & Events", icon: Calendar },
      { to: m("calendar"), label: "Academic Calendar", icon: Calendar },
    ]},
    { group: "Inbox", items: [
      { to: m("inquiries"), label: "Enquiries", icon: Inbox },
      { to: m("volunteers"), label: "Volunteer Sign-ups", icon: Users },
      { to: m("subscribers"), label: "Subscribers", icon: Send },
    ]},
  ],
  teacher: [
    { group: "Overview", items: [
      { to: "/portal/teacher", label: "Dashboard", icon: LayoutDashboard },
      { to: m("timetable"), label: "Timetable", icon: Calendar },
      { to: m("attendance"), label: "Attendance Register", icon: ClipboardList },
    ]},
    { group: "Classroom", items: [
      { to: m("classes"), label: "My Classes", icon: GraduationCap },
      { to: m("assignments"), label: "Assignments", icon: ClipboardList },
      { to: m("submissions"), label: "Submissions Register", icon: Inbox },
      { to: m("assessments"), label: "Assessments", icon: CheckCircle2 },
      { to: m("lessonplans"), label: "Lesson Plans", icon: BookOpen },
      { to: m("exams"), label: "Examinations", icon: FileText },
      { to: m("grades"), label: "Grade Book", icon: Award },
      { to: m("gradesheet"), label: "Academic Transcripts", icon: FileSpreadsheet },
      { to: m("reportcard"), label: "Progress Reports", icon: Award },
      { to: m("behavior"), label: "Conduct Records", icon: Award },
      { to: m("counselling"), label: "Counselling Records", icon: Heart },
      { to: m("bookstock"), label: "Library Catalogue", icon: Library },
      { to: m("ptmeetings"), label: "PTM Scheduler", icon: Users },
      { to: m("resources"), label: "Resources", icon: Library },
      { to: m("library"), label: "Digital Library", icon: Library },
    ]},
    { group: "Communications", items: [
      { to: m("announcements"), label: "Announcements", icon: Megaphone },
      { to: m("messages"), label: "Messages", icon: MessageSquare },
      { to: m("calendar"), label: "Academic Calendar", icon: Calendar },
      { to: m("leaverequests"), label: "My Leave Requests", icon: Inbox },
      { to: m("approvals"), label: "Submit Request", icon: CheckCircle2 },
    ]},
  ],
  student: [
    { group: "Overview", items: [
      { to: "/portal/student", label: "Dashboard", icon: LayoutDashboard },
      { to: m("timetable"), label: "Timetable", icon: Calendar },
      { to: m("assignments"), label: "Assignments", icon: ClipboardList },
      { to: m("calendar"), label: "Academic Calendar", icon: Calendar },
    ]},
    { group: "Academics", items: [
      { to: m("classes"), label: "My Subjects", icon: BookOpen },
      { to: m("grades"), label: "Grades & Results", icon: Award },
      { to: m("assessments"), label: "Assessments", icon: CheckCircle2 },
      { to: m("submissions"), label: "My Submissions", icon: Inbox },
      { to: m("gradesheet"), label: "Academic Transcript", icon: FileSpreadsheet },
      { to: m("reportcard"), label: "Progress Report", icon: Award },
      { to: m("exams"), label: "Examinations", icon: FileText },
      { to: m("library"), label: "Digital Library", icon: Library },
    ]},
    { group: "Communications", items: [
      { to: m("announcements"), label: "Announcements", icon: Megaphone },
      { to: m("messages"), label: "Messages", icon: MessageSquare },
    ]},
  ],
  nurse: [
    { group: "Overview", items: [
      { to: "/portal/nurse", label: "Dashboard", icon: LayoutDashboard },
      { to: m("clinic"), label: "Visit Log", icon: Heart },
      { to: m("healthalerts"), label: "Health Alerts", icon: Heart },
    ]},
    { group: "Health Records", items: [
      { to: m("immunizations"), label: "Immunisation Records", icon: Heart },
      { to: m("medications"), label: "Medication Administration", icon: Heart },
      { to: m("medicalscreenings"), label: "Health Screenings", icon: Heart },
      { to: m("counselling"), label: "Counselling Records", icon: Heart },
      { to: m("directory"), label: "Student Directory", icon: Users },
      { to: m("approvals"), label: "Submit Request", icon: CheckCircle2 },
    ]},
    { group: "Communications", items: [
      { to: m("announcements"), label: "Announcements", icon: Megaphone },
      { to: m("messages"), label: "Messages", icon: MessageSquare },
      { to: m("calendar"), label: "Academic Calendar", icon: Calendar },
    ]},
  ],
  parent: [
    { group: "Overview", items: [
      { to: "/portal/parent", label: "Dashboard", icon: LayoutDashboard },
      { to: m("children"), label: "My Children", icon: Heart },
      { to: m("calendar"), label: "Academic Calendar", icon: Calendar },
    ]},
    { group: "Academics", items: [
      { to: m("grades"), label: "Grades & Results", icon: Award },
      { to: m("gradesheet"), label: "Academic Transcript", icon: FileSpreadsheet },
      { to: m("reportcard"), label: "Progress Report", icon: Award },
      { to: m("exams"), label: "Examinations", icon: FileText },
      { to: m("attendance"), label: "Attendance Record", icon: ClipboardList },
      { to: m("behavior"), label: "Conduct Records", icon: Award },
    ]},
    { group: "Finance", items: [
      { to: m("fees"), label: "Tuition & Fees", icon: DollarSign },
      { to: m("scholarships"), label: "Scholarships & Aid", icon: Award },
      { to: m("transport"), label: "Transport", icon: FolderTree },
    ]},
    { group: "Health", items: [
      { to: m("clinic"), label: "Clinic Visits", icon: Heart },
      { to: m("immunizations"), label: "Immunisation Records", icon: Heart },
      { to: m("medications"), label: "Medications", icon: Heart },
      { to: m("healthalerts"), label: "Health Alerts", icon: Heart },
    ]},
    { group: "Communications", items: [
      { to: m("announcements"), label: "Announcements", icon: Megaphone },
      { to: m("messages"), label: "Messages", icon: MessageSquare },
      { to: m("ptmeetings"), label: "PTM Scheduler", icon: Users },
    ]},
  ],
  alumni: [
    { group: "Overview", items: [
      { to: "/portal/alumni", label: "Dashboard", icon: LayoutDashboard },
      { to: m("directory"), label: "Alumni Network", icon: Users },
    ]},
    { group: "Connections", items: [
      { to: m("events"), label: "Events & Reunions", icon: Calendar },
      { to: m("jobs"), label: "Career Board", icon: Briefcase },
      { to: m("mentorship"), label: "Mentorship Programme", icon: Heart },
    ]},
    { group: "Community", items: [
      { to: m("donations"), label: "Donations", icon: DollarSign },
      { to: m("scholarships"), label: "Scholarships", icon: Award },
      { to: m("posts"), label: "News & Stories", icon: Newspaper },
    ]},
  ],
};

/** Scrolling announcement ticker visible to all authenticated portal users. */
function AnnouncementBanner() {
  const { primaryRole } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const all = mockDb.list<any>("announcements");
    // Filter by audience + active status
    const filtered = all.filter((a) => {
      if (a.active === "Archived") return false;
      const aud = (a.audience ?? "All").toLowerCase();
      if (aud === "all") return true;
      if (!primaryRole) return false;
      if (aud === "staff") return ["superadmin","admin","admin_assistant","registrar","admissions_officer","teacher","nurse"].includes(primaryRole);
      if (aud === "students") return primaryRole === "student";
      if (aud === "parents") return primaryRole === "parent";
      if (aud === "alumni") return primaryRole === "alumni";
      return true;
    });
    setAnnouncements(filtered);
  }, [primaryRole]);

  if (dismissed || announcements.length === 0) return null;

  const text = announcements.map((a) => `📢 ${a.title}${a.body ? " — " + String(a.body).slice(0, 80) : ""}`).join("     ·     ");

  return (
    <div className="relative flex items-center h-9 bg-primary text-primary-foreground text-sm font-medium overflow-hidden shrink-0">
      <div className="absolute inset-0 overflow-hidden">
        <div
          ref={trackRef}
          className="whitespace-nowrap animate-marquee px-4"
          style={{ animationDuration: `${Math.max(18, text.length * 0.12)}s` }}
        >
          {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 grid place-items-center shrink-0 z-10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function PortalShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const { profile, primaryRole, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const groups = primaryRole ? navByRole[primaryRole] : [];

  // Persist sidebar collapsed/expanded across refreshes & sessions via cookie set by SidebarProvider.
  const sidebarDefaultOpen = (() => {
    if (typeof document === "undefined") return true;
    const m = document.cookie.match(/(?:^|;\s*)sidebar_state=(true|false)/);
    return m ? m[1] === "true" : true;
  })();

  return (
    <SidebarProvider defaultOpen={sidebarDefaultOpen}>
      <div className="flex min-h-[calc(100vh-5rem)] w-full bg-muted/30">
        <Sidebar collapsible="icon" className="top-20 !h-[calc(100svh-5rem)] text-[15px]">
          <SidebarHeader>
            <Link to="/portal" className="flex items-center gap-3 px-2 py-3">
              <Logo size={44} />
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="font-display font-bold text-[15px] leading-tight truncate"><BrandWordmark /></p>
                <p className="text-[11px] text-muted-foreground truncate">{profile?.full_name ?? "User"} · {primaryRole ? ROLE_LABEL[primaryRole] : "—"}</p>
              </div>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            {groups.map((g) => (
              <SidebarGroup key={g.group}>
                <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider">{g.group}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {g.items.map((it, idx) => {
                      const Icon = it.icon;
                      const active = pathname === it.to;
                      return (
                        <SidebarMenuItem key={`${g.group}-${idx}`}>
                          <SidebarMenuButton asChild isActive={active} tooltip={it.label} className="h-11 text-[15px] font-medium">
                            <Link to={it.to}>
                              <Icon className="h-5 w-5" />
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
              <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider">Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/portal/profile"} tooltip="My Profile" className="h-11 text-[15px] font-medium">
                      <Link to="/portal/profile">
                        <UserCog className="h-5 w-5" />
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
                  className="h-11 text-[15px] font-medium"
                  onClick={async () => { await signOut(); navigate("/"); }}
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 min-w-0 flex flex-col">
          <AnnouncementBanner />
          <header className="sticky top-20 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 backdrop-blur px-5">
            <SidebarTrigger />
            <div className="h-5 w-px bg-border mx-1" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-semibold">{title}</p>
            </div>
            <CommandPalette role={primaryRole} groups={groups} />
            <NotificationsBell />
            <button className="hidden sm:grid h-10 w-10 rounded-full bg-card border border-border place-items-center hover:bg-muted"><Settings className="h-[18px] w-[18px]" /></button>
          </header>

          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 px-5 sm:px-8 lg:px-12 py-8 lg:py-10 text-[15px]"
          >
            <div className="mb-8">
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-2 text-base sm:text-lg text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
          </motion.main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function CommandPalette({ role, groups }: { role: AppRole | null; groups: NavGroup[] }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const go = (to: string) => { setOpen(false); navigate(to); };
  const classes = mockDb.list<any>("classes");
  const assignments = mockDb.list<any>("assignments");
  const directory = mockDb.list<any>("directory");
  const posts = mockDb.list<any>("posts");
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex items-center gap-2 rounded-full border border-border bg-card pl-3 pr-2 py-1.5 text-sm text-muted-foreground hover:border-primary/40 transition"
        aria-label="Open command palette"
      >
        <SearchIcon className="h-4 w-4" />
        <span>Quick search…</span>
        <kbd className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold">⌘K</kbd>
      </button>
      <button onClick={() => setOpen(true)} className="md:hidden h-10 w-10 rounded-full bg-card border border-border grid place-items-center hover:bg-muted" aria-label="Search">
        <SearchIcon className="h-[18px] w-[18px]" />
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search modules, classes, assignments, people…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading={role ? `${ROLE_LABEL[role]} modules` : "Modules"}>
            {groups.flatMap((g) =>
              g.items.map((it) => (
                <CommandItem key={`${g.group}-${it.to}-${it.label}`} value={`${g.group} ${it.label}`} onSelect={() => go(it.to)}>
                  <it.icon className="mr-2 h-4 w-4" />
                  <span>{it.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{g.group}</span>
                </CommandItem>
              ))
            )}
          </CommandGroup>
          {classes.length > 0 && (
            <CommandGroup heading="Classes">
              {classes.slice(0, 8).map((c) => (
                <CommandItem key={c.id} value={`class ${c.name} ${c.teacher}`} onSelect={() => go("/portal/m/classes")}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  <span>{c.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{c.teacher}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {assignments.length > 0 && (
            <CommandGroup heading="Assignments">
              {assignments.slice(0, 8).map((a) => (
                <CommandItem key={a.id} value={`assignment ${a.title} ${a.class}`} onSelect={() => go("/portal/m/assignments")}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  <span>{a.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{a.class}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {directory.length > 0 && (
            <CommandGroup heading="People">
              {directory.slice(0, 6).map((p) => (
                <CommandItem key={p.id} value={`person ${p.name} ${p.role}`} onSelect={() => go("/portal/m/directory")}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>{p.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Class of {p.year}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {posts.length > 0 && (
            <CommandGroup heading="Posts">
              {posts.slice(0, 6).map((p) => (
                <CommandItem key={p.id} value={`post ${p.title}`} onSelect={() => go("/portal/m/posts")}>
                  <Newspaper className="mr-2 h-4 w-4" />
                  <span>{p.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{p.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

export function StatCard({ icon: Icon, label, value, delta, accent = "primary" }: { icon: any; label: string; value: string | number; delta?: string; accent?: "primary" | "secondary" | "accent" }) {
  const bg = accent === "secondary" ? "bg-secondary/10 text-secondary" : accent === "accent" ? "bg-accent/20 text-accent-foreground" : "bg-primary/10 text-primary";
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-start justify-between">
        <div className={`h-12 w-12 rounded-xl grid place-items-center ${bg}`}><Icon className="h-6 w-6" /></div>
        {delta && <span className="text-sm font-semibold text-primary">{delta}</span>}
      </div>
      <p className="mt-4 text-4xl font-bold font-display">{value}</p>
      <p className="text-base text-muted-foreground">{label}</p>
    </motion.div>
  );
}

export { FileText, Calendar, Users, BookOpen, GraduationCap, Heart, Award };
/** Header bell: approval-workflow notifications for the signed-in user. */
function NotificationsBell() {
  const { profile, primaryRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    setItems(approvalsStore.notifications(profile.$id, primaryRole));
  }, [profile?.$id, primaryRole, open]);

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative h-10 w-10 rounded-full bg-card border border-border grid place-items-center hover:bg-muted"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold grid place-items-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">Notifications</p>
            {items.length > 0 && (
              <button
                className="text-xs text-primary font-semibold"
                onClick={() => { if (profile) approvalsStore.markAllRead(profile.$id, primaryRole); setItems(approvalsStore.notifications(profile!.$id, primaryRole)); }}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">You're all caught up.</p>
            ) : items.slice(0, 20).map((n) => (
              <div key={n.id} className={`px-4 py-3 border-b border-border last:border-0 ${n.read ? "" : "bg-muted/40"}`}>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{new Date(n.at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
