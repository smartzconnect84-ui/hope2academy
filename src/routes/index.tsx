import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Droplet, BookOpen, Stethoscope, Home, ArrowRight, Check } from "lucide-react";
import banner from "@/assets/hope/banner-1-CIHbaCOS.jpg";
import village from "@/assets/hope/project-village-BG6QOkRo.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "HOPE2-LIBERIA — A movement of compassion across Liberia" },
      { name: "description", content: "Education, health, water and community development built side-by-side with Liberian communities." },
      { property: "og:image", content: banner },
    ],
  }),
});

const stats = [
  { value: "12,400+", label: "Lives Impacted" },
  { value: "84", label: "Communities Reached" },
  { value: "142", label: "Projects Completed" },
  { value: "12", label: "Years of Service" },
];

const pillars = [
  { icon: Droplet, title: "Water Projects", desc: "Clean water wells & sanitation for rural villages." },
  { icon: BookOpen, title: "Education Support", desc: "Scholarships, materials and teacher training." },
  { icon: Stethoscope, title: "Healthcare Outreach", desc: "Mobile clinics and life-saving medical care." },
  { icon: Home, title: "Community Development", desc: "Housing, infrastructure and dignity restored." },
];

function Index() {
  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        <img src={banner} alt="Liberian schoolchildren walking to school in golden morning light" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative container mx-auto px-6 py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 backdrop-blur border border-accent/40 text-accent px-4 py-1.5 text-xs font-semibold tracking-wide uppercase">
            <Heart className="h-3 w-3 fill-accent" /> A Liberian Humanitarian Mission
          </span>
          <h1 className="mt-6 text-6xl md:text-8xl font-bold text-background leading-[0.95]">
            Hope<span className="text-secondary">2</span><br />
            <span className="text-accent">Liberia</span>
          </h1>
          <p className="mt-6 text-xl text-background/90 max-w-xl">A movement of compassion across Liberia.</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/get-involved" className="inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-7 py-4 font-semibold hover:brightness-110 transition shadow-[var(--shadow-warm)]">
              <Heart className="h-4 w-4 fill-current" /> Get Involved
            </Link>
            <Link to="/about" className="inline-flex items-center gap-2 rounded-full border-2 border-accent text-accent px-7 py-4 font-semibold hover:bg-accent hover:text-accent-foreground transition">
              Learn More <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="container mx-auto px-6 -mt-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-3xl overflow-hidden shadow-[var(--shadow-soft)]">
          {stats.map((s) => (
            <div key={s.label} className="bg-card p-8 text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary font-[var(--font-display)]">{s.value}</div>
              <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PILLARS */}
      <section className="container mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-secondary font-semibold uppercase tracking-wider text-sm">What We Do</span>
          <h2 className="mt-3 text-5xl font-bold">Four pillars of lasting change</h2>
          <p className="mt-4 text-muted-foreground text-lg">Every program is built on community partnership, transparency, and measurable impact.</p>
        </div>
        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p) => (
            <div key={p.title} className="group p-8 rounded-3xl bg-card border border-border hover:border-primary/30 hover:-translate-y-1 transition-all shadow-[var(--shadow-soft)]">
              <span className="inline-flex h-14 w-14 rounded-2xl bg-primary/10 text-primary items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition">
                <p.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-bold">{p.title}</h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MISSION */}
      <section className="bg-muted py-24">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
          <div className="relative">
            <img src={village} alt="Aerial view of a rebuilt Liberian village" className="rounded-3xl shadow-[var(--shadow-warm)] aspect-[4/5] object-cover" />
            <div className="absolute -bottom-6 -right-6 bg-accent text-accent-foreground rounded-2xl p-6 shadow-[var(--shadow-soft)] max-w-[220px]">
              <div className="text-3xl font-bold">100%</div>
              <div className="text-sm">community-led project design</div>
            </div>
          </div>
          <div>
            <span className="text-secondary font-semibold uppercase tracking-wider text-sm">Our Mission</span>
            <h2 className="mt-3 text-5xl font-bold leading-tight">Hope is not a wish.<br />It's a plan.</h2>
            <p className="mt-6 text-lg text-muted-foreground">
              For over a decade, HOPE2-LIBERIA has worked side-by-side with Liberian communities — listening first, building second. We don't bring solutions. We build them together.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "100% community-led project design",
                "Full financial transparency, every quarter",
                "Long-term partnerships, not short-term aid",
              ].map((t) => (
                <li key={t} className="flex gap-3"><Check className="h-5 w-5 text-primary mt-0.5 shrink-0" /><span>{t}</span></li>
              ))}
            </ul>
            <Link to="/about" className="mt-8 inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
              Read our story <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-24">
        <div className="rounded-[2.5rem] p-12 md:p-20 text-center text-primary-foreground relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
          <h2 className="text-4xl md:text-6xl font-bold max-w-3xl mx-auto leading-tight">Your kindness becomes someone's tomorrow.</h2>
          <p className="mt-6 text-lg max-w-2xl mx-auto opacity-90">Every dollar you give travels directly to a Liberian community working to rebuild what was lost.</p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link to="/get-involved" className="rounded-full bg-secondary text-secondary-foreground px-7 py-4 font-semibold hover:brightness-110">Get Involved</Link>
            <Link to="/projects" className="rounded-full bg-accent text-accent-foreground px-7 py-4 font-semibold hover:brightness-95">See Our Impact</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
