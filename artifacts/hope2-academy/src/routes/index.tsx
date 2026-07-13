import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { Reveal, StaggerGroup } from "@/components/Motion";
import HeroSlider from "@/components/HeroSlider";
import missionAsset from "@/assets/departments/dept-mission.jpg.asset.json";
import academyAsset from "@/assets/departments/dept-academy.jpg.asset.json";
import churchAsset from "@/assets/departments/dept-church.jpg.asset.json";
import mediaAsset from "@/assets/departments/dept-media.jpg.asset.json";
import storyClassroom from "@/assets/uploads/IMG-20260521-WA0012.jpg.asset.json";
import storyKids from "@/assets/uploads/IMG-20260521-WA0039.jpg.asset.json";
import storyGrad from "@/assets/uploads/IMG-20260521-WA0027.jpg.asset.json";

// --- CONTENT ------------------------------------------------------------
const ribbon = [
  { k: "01", label: "Margibi, Liberia" },
  { k: "02", label: "Founded 2014" },
  { k: "03", label: "Learning · Faith · Service" },
  { k: "04", label: "USD & LRD tuition" },
];

const chapters = [
  {
    tag: "Chapter 01 — Academy",
    title: "A classroom that raises leaders, not just students.",
    body:
      "From ABC through Grade 12, HOPE2 ACADEMY blends a rigorous Liberian curriculum with character formation, mentorship, and creative expression — so every child leaves prepared to serve their country.",
    stat: { v: "16", u: "grades" },
    href: "/departments",
    cta: "Explore the academy",
    img: academyAsset.url,
    alt: "HOPE2 Academy students in class",
    tone: "forest",
  },
  {
    tag: "Chapter 02 — Mission",
    title: "We walk the villages before we build in them.",
    body:
      "Our Mission team lives inside the communities we serve across Margibi and beyond — listening first, then building water, food security, and family support programs alongside local leaders.",
    stat: { v: "84", u: "communities" },
    href: "/projects",
    cta: "See the field work",
    img: missionAsset.url,
    alt: "HOPE2 Mission field team",
    tone: "crimson",
  },
  {
    tag: "Chapter 03 — Church",
    title: "Faith that shows up on Monday morning.",
    body:
      "HOPE2 Church is the heartbeat of the campus. Sunday worship, midweek discipleship, and pastoral care for staff and families keep our purpose — Learning To Serve For God's Purpose — alive every day.",
    stat: { v: "12", u: "years" },
    href: "/about",
    cta: "Our story of faith",
    img: churchAsset.url,
    alt: "HOPE2 Church congregation",
    tone: "gold",
  },
  {
    tag: "Chapter 04 — Media",
    title: "Telling Liberia's story in Liberia's voice.",
    body:
      "HOPE2 Media trains young creators in film, journalism, and design — documenting the movement, amplifying local heroes, and beaming lessons from Marshall Road to the rest of the world.",
    stat: { v: "1000s", u: "of stories" },
    href: "/stories",
    cta: "Watch, read, listen",
    img: mediaAsset.url,
    alt: "HOPE2 Media student crew",
    tone: "forest",
  },
];

const impactStats = [
  { v: "12,400+", label: "Lives touched across Margibi & Liberia" },
  { v: "142", label: "Community projects delivered since 2014" },
  { v: "97%", label: "Grade-12 graduation rate in 2026" },
  { v: "USD + LRD", label: "Every fee, gift & scholarship in both" },
];

const stories = [
  { img: storyClassroom.url, tag: "Academy", title: "A Grade 9 classroom that talks back", href: "/stories" },
  { img: storyKids.url,      tag: "Mission",  title: "Clean water in Kakata: year two", href: "/projects" },
  { img: storyGrad.url,      tag: "Alumni",   title: "Where the Class of 2024 went next", href: "/stories" },
];

// --- COMPONENTS ---------------------------------------------------------
function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-3 text-xs font-medium tracking-[0.24em] uppercase text-[color:var(--color-crimson)]">
      <span className="h-px w-8 bg-[color:var(--color-crimson)]/60" />
      {children}
    </span>
  );
}

function Chapter({ c, index }: { c: typeof chapters[number]; index: number }) {
  const reverse = index % 2 === 1;
  return (
    <section className="relative">
      <div className="container mx-auto px-6 py-24 md:py-32">
        <div className={`grid lg:grid-cols-12 gap-10 lg:gap-16 items-center ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
          {/* Image side */}
          <Reveal className="lg:col-span-7 relative">
            <div className="relative">
              <div className="absolute -inset-3 md:-inset-4 rounded-[2rem] bg-[color:var(--color-gold)]/50 -z-10 translate-x-2 translate-y-2" />
              <img
                src={c.img}
                alt={c.alt}
                loading="lazy"
                className="w-full aspect-[4/3] object-cover rounded-[1.75rem] shadow-[var(--shadow-warm)]"
              />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 }}
                className={`absolute -bottom-6 ${reverse ? "-right-4" : "-left-4"} md:-bottom-8 bg-[color:var(--color-forest)] text-[color:var(--color-cream)] rounded-2xl px-6 py-5 shadow-[var(--shadow-soft)]`}
              >
                <div className="text-4xl md:text-5xl font-bold leading-none tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                  {c.stat.v}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] opacity-80">{c.stat.u}</div>
              </motion.div>
            </div>
          </Reveal>

          {/* Text side */}
          <Reveal delay={0.15} className="lg:col-span-5">
            <SectionEyebrow>{c.tag}</SectionEyebrow>
            <h2 className="mt-5 text-4xl md:text-5xl leading-[1.05] font-semibold text-[color:var(--color-forest)]" style={{ fontFamily: "var(--font-display)" }}>
              {c.title}
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{c.body}</p>
            <Link
              to={c.href}
              className="group mt-8 inline-flex items-center gap-3 text-[color:var(--color-forest)] font-semibold border-b-2 border-[color:var(--color-crimson)] pb-1 hover:gap-4 transition-all"
            >
              {c.cta} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Index() {
  return (
    <div className="bg-background">
      {/* HERO — untouched */}
      <HeroSlider />

      {/* IDENTITY RIBBON */}
      <section className="border-y border-[color:var(--color-forest)]/10 bg-[color:var(--color-cream)]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[color:var(--color-forest)]/10">
            {ribbon.map((r) => (
              <div key={r.k} className="flex items-center gap-4 py-6 px-4 first:pl-0">
                <span className="text-xs font-mono text-[color:var(--color-crimson)]">{r.k}</span>
                <span className="text-sm font-medium text-[color:var(--color-forest)]">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-6 pt-24 md:pt-32 pb-8">
          <div className="max-w-5xl">
            <SectionEyebrow>The HOPE2 movement</SectionEyebrow>
            <h2 className="mt-6 text-[2.75rem] md:text-[4.25rem] leading-[1.02] font-semibold text-[color:var(--color-forest)]" style={{ fontFamily: "var(--font-display)" }}>
              Learning to serve, <span className="text-[color:var(--color-crimson)]">for God's purpose</span> — right here in Margibi.
            </h2>
            <p className="mt-8 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
              HOPE2 ACADEMY is more than a school. It's an academy, a mission, a church, and a media house — four hands of one movement raising Liberia's next generation of leaders, healers, and storytellers.
            </p>
          </div>
        </div>
      </section>

      {/* ZIGZAG CHAPTERS */}
      <div className="divide-y divide-[color:var(--color-forest)]/5">
        {chapters.map((c, i) => (
          <Chapter c={c} index={i} key={c.tag} />
        ))}
      </div>

      {/* PULL QUOTE */}
      <section className="bg-[color:var(--color-forest)] text-[color:var(--color-cream)] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[color:var(--color-crimson)]/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[color:var(--color-gold)]/15 blur-3xl" />
        <div className="container mx-auto px-6 py-24 md:py-32 relative">
          <div className="max-w-4xl">
            <Quote className="h-12 w-12 text-[color:var(--color-gold)]" />
            <blockquote
              className="mt-6 text-3xl md:text-5xl font-medium leading-[1.15]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              "We are not raising graduates. We are raising people who will walk back into their villages and refuse to let them stay broken."
            </blockquote>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-px w-12 bg-[color:var(--color-gold)]" />
              <div>
                <div className="font-semibold text-[color:var(--color-gold)]">Rev. Joseph Wreh</div>
                <div className="text-sm opacity-80">Founder & Senior Pastor, HOPE2</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT NUMBERS */}
      <section className="bg-[color:var(--color-cream)]">
        <div className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
            {impactStats.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.06}>
                <div className="flex flex-col">
                  <div
                    className="text-5xl md:text-6xl font-semibold text-[color:var(--color-crimson)] leading-none"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {s.v}
                  </div>
                  <div className="mt-4 text-sm md:text-base text-[color:var(--color-forest)] max-w-[16rem] leading-snug">
                    {s.label}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* STORIES ROW */}
      <section className="container mx-auto px-6 py-24 md:py-32">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div>
            <SectionEyebrow>Field notes</SectionEyebrow>
            <h2 className="mt-4 text-4xl md:text-5xl font-semibold text-[color:var(--color-forest)]" style={{ fontFamily: "var(--font-display)" }}>
              Stories from the movement
            </h2>
          </div>
          <Link to="/stories" className="group inline-flex items-center gap-2 text-[color:var(--color-crimson)] font-semibold">
            All stories <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <StaggerGroup className="grid md:grid-cols-3 gap-6">
          {stories.map((s) => (
            <motion.div
              key={s.title}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-[1.5rem] bg-card shadow-[var(--shadow-soft)]"
            >
              <Link to={s.href} className="block">
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={s.img}
                    alt={s.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6 text-[color:var(--color-cream)] bg-gradient-to-t from-[color:var(--color-forest)]/95 via-[color:var(--color-forest)]/50 to-transparent">
                  <div className="text-xs font-mono tracking-widest uppercase text-[color:var(--color-gold)]">{s.tag}</div>
                  <div className="mt-2 text-xl font-semibold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                    {s.title}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </StaggerGroup>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 pb-24">
        <Reveal className="rounded-[2.5rem] overflow-hidden">
          <div
            className="relative p-10 md:p-20 text-[color:var(--color-cream)]"
            style={{
              background:
                "linear-gradient(135deg, #0F2A1D 0%, #0F2A1D 55%, #7A1414 100%)",
            }}
          >
            <div className="absolute top-8 right-8 h-24 w-24 rounded-full bg-[color:var(--color-gold)]/20 blur-2xl" />
            <div className="grid lg:grid-cols-12 gap-10 items-end relative">
              <div className="lg:col-span-8">
                <SectionEyebrow>
                  <span className="text-[color:var(--color-gold)]">Join the movement</span>
                </SectionEyebrow>
                <h2
                  className="mt-6 text-4xl md:text-6xl leading-[1.05] font-semibold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Sponsor a student. <br />
                  Send a child to school in <span className="text-[color:var(--color-gold)]">Margibi</span>.
                </h2>
                <p className="mt-6 max-w-xl text-lg opacity-90">
                  A full year of tuition, uniform, books and one meal a day costs USD 320 · LRD 60,800. Every gift is receipted and reported.
                </p>
              </div>
              <div className="lg:col-span-4 flex flex-col gap-3">
                <Link
                  to="/get-involved"
                  className="rounded-full bg-[color:var(--color-gold)] text-[color:var(--color-forest)] px-7 py-4 font-semibold text-center transition-all hover:brightness-110 active:scale-95"
                >
                  Sponsor a student
                </Link>
                <Link
                  to="/contact"
                  className="rounded-full border border-[color:var(--color-cream)]/40 px-7 py-4 font-semibold text-center hover:bg-[color:var(--color-cream)]/10 transition-all"
                >
                  Talk to admissions
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

export default Index;
