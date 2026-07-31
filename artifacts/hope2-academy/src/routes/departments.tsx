import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { useSiteContent } from "@/lib/site-content";

function Departments() {
  const c = useSiteContent();
  const pillars = c.divisions
    .filter((d) => d.published !== false)
    .map((d) => ({
      ...d,
      img: d.image,
      bodyParas: d.body.split(/\n\s*\n/).filter(Boolean),
      bulletList: d.bullets.split("\n").map((b) => b.trim()).filter(Boolean),
    }));
  return (
    <div>
      <PageHeader eyebrow={c.divisionsEyebrow} title={c.divisionsTitle} lead={c.divisionsLead} />
      {pillars.map((p, i) => (
        <section key={p.id} id={p.id} className={`py-20 ${i % 2 === 1 ? "bg-muted" : ""}`}>
          <div className={`container mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
            <div className="relative">
              <img src={p.img} alt={`${p.title} pillar imagery`} className="rounded-3xl shadow-[var(--shadow-warm)] aspect-[4/5] object-cover w-full" />
              <div className="absolute -top-4 -left-4 h-16 w-16 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{p.roman}</div>
            </div>
            <div>
              <span className="text-secondary font-semibold uppercase tracking-wider text-xs">{p.pillar}</span>
              <h2 className="mt-3 text-4xl md:text-5xl font-bold">{p.title}</h2>
              <p className="mt-2 text-xl italic text-foreground/70" style={{ fontFamily: "var(--font-display)" }}>{p.tag}</p>
              {p.bodyParas.map((b, idx) => <p key={idx} className="mt-4 text-muted-foreground leading-relaxed">{b}</p>)}
              <div className="mt-6 text-sm">
                <div className="text-muted-foreground">{p.est} · {p.area}</div>
              </div>
              <ul className="mt-6 space-y-2 text-sm">
                {p.bulletList.map((b) => <li key={b} className="flex gap-2"><span className="text-secondary">▸</span>{b}</li>)}
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
