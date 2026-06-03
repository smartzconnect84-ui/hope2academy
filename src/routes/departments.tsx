import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import outreach from "@/assets/hope/dept-outreach-BqPAShO5.jpg";
import edu from "@/assets/hope/dept-education-aYewL80F.jpg";
import community from "@/assets/hope/dept-community-DR-ZUlx6.jpg";
import health from "@/assets/hope/dept-health-xwwilth4.jpg";

const pillars = [
  {
    img: outreach, id: "mission", roman: "I", pillar: "Division I — Compassion in motion",
    title: "HOPE2 MISSION", tag: "Hands and feet across Liberia.",
    impactN: "27", impactL: "Villages served",
    director: "Esther Pewee, Mission Coordinator",
    est: "Established 2013", area: "Operating in 4 counties",
    body: [
      "HOPE2 MISSION is the humanitarian heart of our movement — mobile clinics, clean water, food security and disaster response carried directly to the communities that need them most.",
      "We work alongside local leaders to identify needs, design solutions, and measure results. Every project is co-built with the village it serves; nothing is imposed.",
      "From maternal-health outreach in Margibi to clean-water boreholes in Bong, the Mission division is where compassion becomes infrastructure.",
    ],
    bullets: [
      "Mobile medical outreach in remote districts",
      "Clean-water boreholes & sanitation projects",
      "Food, clothing and emergency relief distribution",
      "Skills training for women and youth",
      "Partnerships with the Liberian Ministry of Health",
    ],
  },
  {
    img: edu, id: "academy", roman: "II", pillar: "Division II — Learning that lasts a lifetime",
    title: "HOPE2 ACADEMY", tag: "Every child, a future.",
    impactN: "1,840", impactL: "Students enrolled",
    director: "Grace Kollie, Director of HOPE2 ACADEMY",
    est: "Established 2013", area: "Main campus — Marshall Road, Margibi",
    body: [
      "HOPE2 ACADEMY — affectionately known as The Lizard Kingdom — is the K-12 Christian school that anchors the movement. Our motto: \"Learning To Serve For God's Purpose.\"",
      "We offer rigorous academics paired with character formation, sports, music and service learning. Most students are sponsored by friends of HOPE2 across Liberia and abroad.",
      "Every scholarship comes with a mentor and a six-month progress check. We measure success by attendance, literacy growth, and graduation — and publish the numbers every term.",
    ],
    bullets: [
      "Tuition & uniform support for 1,840 students",
      "Solar-powered library and computer lab",
      "STEM, civics and Bible curriculum",
      "Annual scholarships for top secondary-school entrants",
      "Teacher development in early literacy & STEM",
    ],
  },
  {
    img: community, id: "church", roman: "III", pillar: "Division III — Worship, discipleship, community",
    title: "HOPE2 CHURCH", tag: "A house of prayer for all people.",
    impactN: "9", impactL: "Local congregations",
    director: "Pastor Joseph Wreh, Lead Pastor",
    est: "Established 2014", area: "Congregations across Margibi & Montserrado",
    body: [
      "HOPE2 CHURCH is the spiritual home of the movement — local congregations that gather for worship, discipleship, prayer and pastoral care.",
      "We serve children's church, youth fellowships, women's and men's ministries, and outreach to the elderly and incarcerated.",
      "Every Sunday is open to anyone — student, parent, visitor, neighbour. Come as you are.",
    ],
    bullets: [
      "Weekly Sunday worship at the Marshall Road sanctuary",
      "Youth & children's discipleship classes",
      "Pastoral counselling and home visitation",
      "Community prayer & healing services",
      "Marriage, baptism and dedication ceremonies",
    ],
  },
  {
    img: health, id: "media", roman: "IV", pillar: "Division IV — Telling Liberia's story",
    title: "HOPE2 MEDIA", tag: "Stories that move hearts and hands.",
    impactN: "120+", impactL: "Stories published",
    director: "Patience Kollie, Media & Communications Lead",
    est: "Established 2018", area: "Radio, social, print & video",
    body: [
      "HOPE2 MEDIA carries the voice of the movement — radio devotionals, short documentaries, social-media stories, and a quarterly print magazine.",
      "We train young Liberian writers, photographers and producers to tell their own stories — beautifully, honestly, and with hope.",
      "If you want to partner, sponsor, or contribute content, reach out via the Contact page.",
    ],
    bullets: [
      "Weekly radio program on community FM",
      "Documentary shorts on YouTube and Instagram",
      "Quarterly print magazine \"Hope For Liberia\"",
      "Training program for young Liberian journalists",
      "Live-streamed worship and special events",
    ],
  },
];

function Departments() {
  return (
    <div>
      <PageHeader eyebrow="Our Four Divisions" title="Four divisions. One unwavering mission." lead='"We do not bring solutions to Liberia. We build them, together, beside her people." — The HOPE2 Charter' />
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
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">The four divisions are not separate organisations. They are one body, serving one Liberia.</p>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {pillars.map((p) => (
            <a key={p.id} href={`#${p.id}`} className="rounded-2xl border border-border bg-card p-6 text-left hover:border-primary transition">
              <div className="text-secondary text-sm font-semibold">Division {p.roman}</div>
              <div className="font-bold mt-1">{p.title}</div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Departments;
