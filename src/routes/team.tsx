
import { PageHeader } from "@/components/PageHeader";
import { Linkedin, Mail } from "lucide-react";
import t1 from "@/assets/hope/team-1-Bn-q5HvV.jpg";
import t2 from "@/assets/hope/team-2-D4VCNnPr.jpg";
import t3 from "@/assets/hope/team-3-tdy6Cq2g.jpg";
import t4 from "@/assets/hope/team-4-2AMdCmzy.jpg";
import t5 from "@/assets/hope/team-5-TEI3yivU.jpg";
import t6 from "@/assets/hope/team-6-C_ZECXo7.jpg";


const members = [
  { img: t1, name: "Rev. Samuel K. Doe", role: "Founder & Executive Director" },
  { img: t2, name: "Mariama Johnson", role: "Director of Operations" },
  { img: t3, name: "Dr. Emmanuel Tarpeh", role: "Head of Health & Wellness" },
  { img: t4, name: "Grace Kollie", role: "Director of Education" },
  { img: t5, name: "Joseph Wreh", role: "Community Development Lead" },
  { img: t6, name: "Esther Pewee", role: "Outreach & Missions Coordinator" },
];

function Team() {
  return (
    <div>
      <PageHeader eyebrow="Our People" title="The hands, hearts, and minds behind the mission." lead="A Liberian-led team of directors, doctors, educators, and community builders — united by one promise." />
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center">Meet the leadership</h2>
        <p className="mt-3 text-center text-muted-foreground max-w-xl mx-auto">Six leaders. One mission. Every member of our team lives and works alongside the communities we serve.</p>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {members.map((m) => (
            <div key={m.name} className="group rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-soft)]">
              <div className="aspect-[4/5] overflow-hidden">
                <img src={m.img} alt={`Portrait of ${m.name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold">{m.name}</h3>
                <p className="text-sm text-secondary font-medium">{m.role}</p>
                <div className="mt-4 flex gap-3">
                  <a href="#" aria-label={`${m.name} LinkedIn`} className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition"><Linkedin className="h-4 w-4" /></a>
                  <a href="#" aria-label={`Email ${m.name}`} className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition"><Mail className="h-4 w-4" /></a>
                </div>
              </div>
            </div>
          ))}
        </div>
        <blockquote className="mt-20 max-w-3xl mx-auto text-center text-2xl md:text-3xl italic text-foreground/80" style={{ fontFamily: "var(--font-display)" }}>
          "We are not visitors to Liberia. We are her sons and daughters, building the country we love."
          <footer className="mt-4 text-sm not-italic text-muted-foreground">— The HOPE2-LIBERIA Team</footer>
        </blockquote>
      </section>
    </div>
  );
}

export default Team;
