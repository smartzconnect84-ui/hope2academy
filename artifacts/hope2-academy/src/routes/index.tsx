import { Link, Navigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { Reveal, StaggerGroup } from "@/components/Motion";
import HeroSlider from "@/components/HeroSlider";
import { useSiteContent, type HomeChapter } from "@/lib/site-content";
import { useAuth } from "@/hooks/use-auth";

// --- COMPONENTS ---------------------------------------------------------
function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-3 text-xs font-medium tracking-[0.24em] uppercase text-[color:var(--color-crimson)]">
      <span className="h-px w-8 bg-[color:var(--color-crimson)]/60" />
      {children}
    </span>
  );
}

function Chapter({ c, index }: { c: HomeChapter; index: number }) {
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
                src={c.image}
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
                  {c.statValue}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] opacity-80">{c.statUnit}</div>
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
  const { user, loading } = useAuth();
  const content = useSiteContent();
  const { ribbon, chapters, impactStats, cards } = content.home;
  const h = content.home;
  // If the user is signed in, send them straight to their portal dashboard.
  if (!loading && user) return <Navigate to="/portal" replace />;
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
            <SectionEyebrow>{h.manifestoEyebrow}</SectionEyebrow>
            <h2 className="mt-6 text-[2.75rem] md:text-[4.25rem] leading-[1.02] font-semibold text-[color:var(--color-forest)]" style={{ fontFamily: "var(--font-display)" }}>
              {h.manifestoHeading} <span className="text-[color:var(--color-crimson)]">{h.manifestoAccent}</span>
            </h2>
            <p className="mt-8 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
              {h.manifestoLead}
            </p>
          </div>
        </div>
      </section>

      {/* ZIGZAG CHAPTERS */}
      <div className="divide-y divide-[color:var(--color-forest)]/5">
        {chapters.map((c, i) => (
          <Chapter c={c} index={i} key={c.id} />
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
              &ldquo;{h.quote}&rdquo;
            </blockquote>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-px w-12 bg-[color:var(--color-gold)]" />
              <div>
                <div className="font-semibold text-[color:var(--color-gold)]">{h.quoteAuthor}</div>
                <div className="text-sm opacity-80">{h.quoteSub}</div>
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
      {cards.length > 0 && (
      <section className="container mx-auto px-6 py-24 md:py-32">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div>
            <SectionEyebrow>{h.cardsEyebrow}</SectionEyebrow>
            <h2 className="mt-4 text-4xl md:text-5xl font-semibold text-[color:var(--color-forest)]" style={{ fontFamily: "var(--font-display)" }}>
              {h.cardsHeading}
            </h2>
          </div>
          <Link to="/stories" className="group inline-flex items-center gap-2 text-[color:var(--color-crimson)] font-semibold">
            All stories <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <StaggerGroup className="grid md:grid-cols-3 gap-6">
          {cards.map((s) => (
            <motion.div
              key={s.id}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-[1.5rem] bg-card shadow-[var(--shadow-soft)]"
            >
              <Link to={s.href} className="block">
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={s.image}
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
      )}

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
                  Sponsor tuition, uniforms and books for a student. Contact the office for current rates in USD and LRD — every gift is receipted and reported.
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
