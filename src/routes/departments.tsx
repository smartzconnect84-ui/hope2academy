import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import edu from "@/assets/hope/dept-education-aYewL80F.jpg";
import health from "@/assets/hope/dept-health-xwwilth4.jpg";
import community from "@/assets/hope/dept-community-DR-ZUlx6.jpg";
import outreach from "@/assets/hope/dept-outreach-BqPAShO5.jpg";

,
});

const pillars = [
  { img: edu, id: "education", roman: "I", pillar: "Pillar I — Learning that lasts a lifetime", title: "Education", tag: "Every child, a future.", impactN: "1,840", impactL: "Students sponsored", director: "Grace Kollie, Director of Education", est: "Established 2014", area: "Active in Montserrado, Bong, Nimba & Lofa", body: ["Liberian children deserve a desk, a book, and a teacher who believes in them. We invest in the long arc of a child's mind — from first grade to first job.", "Our Education pillar partners with 38 public and community schools across four counties, providing tuition support, learning materials, and teacher development for children whose families cannot afford the cost of staying in school.", "Every scholarship is paired with a mentor and a six-month progress check. We measure success not by enrolment alone, but by attendance, literacy growth, and graduation — and we publish the numbers every quarter."], bullets: ["Tuition & uniform support for 1,840 students", "Annual scholarships for top performers entering secondary school", "Library kits & solar-powered reading rooms in 22 schools", "Teacher-training workshops in early literacy & STEM", "Girl-child retention program in rural districts"] },
  { img: health, id: "health", roman: "II", pillar: "Pillar II — Care that travels the last mile", title: "Health & Wellness", tag: "Healing, where roads end.", impactN: "62", impactL: "Mobile clinics held", director: "Dr. Emmanuel Tarpeh, Head of Health & Wellness", est: "Established 2013", area: "Mobile clinics in 11 rural districts", body: ["Healthcare is a right, not a privilege. We carry medicine and skilled hands into villages where the nearest clinic is a day's walk away.", "Our Health & Wellness pillar runs monthly mobile medical outreach clinics, supports three rural fixed-site clinics with medicines and equipment, and trains community health workers to provide care between our visits.", "We focus on the health needs Liberia carries most heavily: maternal & child health, malaria, malnutrition, and hypertension. Every patient seen, every life saved, is recorded in our open quarterly impact report."], bullets: ["62 mobile medical outreach clinics held to date", "Maternal & child health screenings — 9,400+ visits", "Free malaria, hypertension & diabetes testing", "Vaccination & immunization drives in partnership with MoH", "Equipment & medicine support for 3 partner clinics", "Training program for 47 community health workers"] },
  { img: community, id: "community", roman: "III", pillar: "Pillar III — Foundations for everything else", title: "Community Development", tag: "The dignity of a home.", impactN: "142", impactL: "Wells & homes built", director: "Joseph Wreh, Community Development Lead", est: "Established 2015", area: "Projects across 27 villages", body: ["Clean water, safe shelter, dignified infrastructure — the foundation upon which every other good thing is built. We construct alongside the community, never for it.", "Our Community Development pillar believes that no school can teach a thirsty child, and no clinic can heal a homeless family. We build the foundations: water, sanitation, shelter, and power.", "Every project is co-designed with the village it serves. Local masons are hired, local materials are sourced, and a community maintenance committee is trained before we hand over the keys — so what we build, lasts."], bullets: ["67 freshwater wells drilled in remote villages", "Sanitation infrastructure & latrines for 41 communities", "34 homes rebuilt for displaced & elderly families", "Solar electrification of clinics, schools & community halls", "Maintenance committees trained at every project site"] },
  { img: outreach, id: "outreach", roman: "IV", pillar: "Pillar IV — Friendship made tangible", title: "Outreach & Missions", tag: "Hands across borders.", impactN: "320+", impactL: "Volunteers hosted", director: "Esther Pewee, Outreach & Missions Coordinator", est: "Established 2016", area: "Partners across 9 countries", body: ["We mobilize volunteers, churches, and partners to walk physically beside the communities we serve — bringing skills, presence, and lasting friendship.", "Our Outreach & Missions pillar receives international and Liberian volunteers — nurses, teachers, builders, students of life — who serve alongside our team for one to twelve weeks at a time.", "Every visiting team is trained in our principles of dignity-first service. We do not perform charity; we share work. The result is friendship that outlasts the trip and partnerships that fund our deepest projects."], bullets: ["320+ international volunteers hosted since 2016", "Short-term mission trips, 1–12 weeks", "Skill-based fellowships for medical & education professionals", "Cross-cultural community engagement events", "Faith-based & university partnership programs"] },
];

function Departments() {
  return (
    <div>
      <PageHeader eyebrow="Our Four Pillars" title="Four pillars. One unwavering mission." lead='"We do not bring solutions to Liberia. We build them, together, beside her people." — The HOPE2-LIBERIA Charter' />
      {pillars.map((p, i) => (
        <section key={p.id} id={p.id} className={`py-20 ${i % 2 === 1 ? "bg-muted" : ""}`}>
          <div className={`container mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
            <div className="relative">
              <img src={p.img} alt={`${p.title} pillar imagery`} className="rounded-3xl shadow-[var(--shadow-warm)] aspect-[4/5] object-cover w-full" />
              <div className="absolute -bottom-6 -right-6 bg-card rounded-2xl p-6 shadow-[var(--shadow-soft)] text-center border border-border">
                <div className="text-xs uppercase text-muted-foreground tracking-wider">Impact to date</div>
                <div className="text-4xl font-bold text-primary mt-1">{p.impactN}</div>
                <div className="text-sm text-muted-foreground">{p.impactL}</div>
              </div>
              <div className="absolute -top-4 -left-4 h-16 w-16 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{p.roman}</div>
            </div>
            <div>
              <span className="text-secondary font-semibold uppercase tracking-wider text-xs">{p.pillar}</span>
              <h2 className="mt-3 text-4xl md:text-5xl font-bold">{p.title}</h2>
              <p className="mt-2 text-xl italic text-foreground/70" style={{ fontFamily: "var(--font-display)" }}>{p.tag}</p>
              {p.body.map((b, idx) => <p key={idx} className="mt-4 text-muted-foreground leading-relaxed">{b}</p>)}
              <div className="mt-6 text-sm">
                <div className="font-semibold">{p.director}</div>
                <div className="text-muted-foreground">{p.est} · {p.area}</div>
              </div>
              <ul className="mt-6 space-y-2 text-sm">
                {p.bullets.map((b) => <li key={b} className="flex gap-2"><span className="text-secondary">▸</span>{b}</li>)}
              </ul>
              <Link to="/team" className="mt-6 inline-flex text-primary font-semibold">Meet the {p.title} team →</Link>
            </div>
          </div>
        </section>
      ))}
      <section className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold">United in mission</h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">The four pillars are not separate programs. They are one structure, holding up one Liberia.</p>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {pillars.map((p) => (
            <a key={p.id} href={`#${p.id}`} className="rounded-2xl border border-border bg-card p-6 text-left hover:border-primary transition">
              <div className="text-secondary text-sm font-semibold">Pillar {p.roman}</div>
              <div className="font-bold mt-1">{p.title}</div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Departments;
