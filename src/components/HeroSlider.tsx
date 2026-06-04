import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import s1 from "@/assets/hero/IMG-20260521-WA0022-2.jpg.asset.json";
import s2 from "@/assets/hero/IMG-20260521-WA0000.jpg.asset.json";
import s3 from "@/assets/hero/IMG-20260521-WA0003-2.jpg.asset.json";
import s4 from "@/assets/hero/IMG-20260521-WA0006.jpg.asset.json";
import s5 from "@/assets/hero/IMG-20260521-WA0012-2.jpg.asset.json";

type Slide = {
  img: string;
  alt: string;
  kicker: string;
  title: React.ReactNode;
  body: string;
  primaryCta: { to: string; label: string };
  secondaryCta: { to: string; label: string };
};

const SLIDES: Slide[] = [
  {
    img: s1.url,
    alt: "HOPE2 ACADEMY student reading scripture in uniform",
    kicker: "Faith · Character · Scholarship",
    title: (<>Raising leaders <br/><span className="text-accent">rooted in purpose</span></>),
    body: "At HOPE2 ACADEMY, every learner is formed in faith, discipline, and the joy of discovery — ABC through 12th grade.",
    primaryCta: { to: "/get-involved", label: "Sponsor a Student" },
    secondaryCta: { to: "/about", label: "Our Mission" },
  },
  {
    img: s2.url,
    alt: "Student studying the Bible during devotion",
    kicker: "HOPE2 CHURCH · Daily Devotion",
    title: (<>A foundation of <span className="text-accent">faith & wisdom</span></>),
    body: "Mornings begin with Scripture and reflection — anchoring each child's learning in values that last a lifetime.",
    primaryCta: { to: "/departments", label: "Explore Divisions" },
    secondaryCta: { to: "/stories", label: "Read Stories" },
  },
  {
    img: s3.url,
    alt: "HOPE2 graduates of the teacher training program",
    kicker: "HOPE2 MISSION · Capacity Building",
    title: (<>Training the <span className="text-accent">teachers of Liberia</span></>),
    body: "We equip educators with certified training so classrooms across the country grow stronger — together we rebuild a nation.",
    primaryCta: { to: "/projects", label: "Our Programs" },
    secondaryCta: { to: "/team", label: "Meet the Team" },
  },
  {
    img: s4.url,
    alt: "Hundreds of HOPE2 ACADEMY students taking exams",
    kicker: "Academic Excellence",
    title: (<>Where focus meets <span className="text-accent">opportunity</span></>),
    body: "From kindergarten to twelfth grade, our scholars sit for rigorous assessments — preparing minds for university and beyond.",
    primaryCta: { to: "/get-involved", label: "Partner With Us" },
    secondaryCta: { to: "/about", label: "Academics" },
  },
  {
    img: s5.url,
    alt: "HOPE2 ACADEMY graduation ceremony in robes",
    kicker: "Class of Hope · Graduation",
    title: (<>Celebrating <span className="text-accent">every milestone</span></>),
    body: "Each cap and gown is a promise kept — to families, to communities, and to the next generation of Liberian leaders.",
    primaryCta: { to: "/get-involved", label: "Give to Scholarships" },
    secondaryCta: { to: "/stories", label: "See Graduates" },
  },
];

const INTERVAL = 6000;

export default function HeroSlider() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((p) => (p + 1) % SLIDES.length), INTERVAL);
    return () => clearInterval(t);
  }, [paused]);

  const go = (n: number) => setI((n + SLIDES.length) % SLIDES.length);
  const slide = SLIDES[i];

  return (
    <section
      className="relative min-h-[88vh] flex items-center overflow-hidden bg-foreground"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="HOPE2 ACADEMY hero stories"
    >
      {/* Image layer (crossfade + Ken Burns) */}
      <AnimatePresence mode="sync">
        <motion.img
          key={i}
          src={slide.img}
          alt={slide.alt}
          initial={{ opacity: 0, scale: 1.12 }}
          animate={{ opacity: 1, scale: 1.0 }}
          exit={{ opacity: 0, scale: 1.06 }}
          transition={{ opacity: { duration: 1.1 }, scale: { duration: 7, ease: "linear" } }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      <div className="absolute inset-0 bg-foreground/40" />

      {/* Content */}
      <div className="relative container mx-auto px-6 py-24 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 backdrop-blur border border-accent/40 text-accent px-4 py-1.5 text-xs font-semibold tracking-wide uppercase">
              <Heart className="h-3 w-3 fill-accent" /> {slide.kicker}
            </span>
            <h1 className="mt-6 text-5xl md:text-7xl font-bold text-background leading-[1.0]">
              {slide.title}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-background/90 max-w-xl">{slide.body}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to={slide.primaryCta.to}
                className="group inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-7 py-4 font-semibold transition shadow-[var(--shadow-warm)] hover:scale-[1.03] hover:shadow-2xl active:scale-95"
              >
                <Heart className="h-4 w-4 fill-current transition-transform group-hover:scale-125" />
                {slide.primaryCta.label}
              </Link>
              <Link
                to={slide.secondaryCta.to}
                className="group inline-flex items-center gap-2 rounded-full border-2 border-accent text-accent px-7 py-4 font-semibold hover:bg-accent hover:text-accent-foreground transition"
              >
                {slide.secondaryCta.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Arrows */}
      <button
        onClick={() => go(i - 1)}
        aria-label="Previous slide"
        className="hidden md:inline-flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-full bg-background/15 backdrop-blur border border-background/30 text-background hover:bg-background/30 transition"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={() => go(i + 1)}
        aria-label="Next slide"
        className="hidden md:inline-flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-full bg-background/15 backdrop-blur border border-background/30 text-background hover:bg-background/30 transition"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {SLIDES.map((_, n) => (
          <button
            key={n}
            onClick={() => go(n)}
            aria-label={`Go to slide ${n + 1}`}
            className={`h-2 rounded-full transition-all ${n === i ? "w-10 bg-accent" : "w-2 bg-background/50 hover:bg-background/80"}`}
          />
        ))}
      </div>
    </section>
  );
}