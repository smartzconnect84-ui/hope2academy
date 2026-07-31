import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { useSiteContent } from "@/lib/site-content";

function Projects() {
  const c = useSiteContent();
  const projects = c.projects.filter((p) => p.published !== false);

  return (
    <div>
      <PageHeader eyebrow={c.projectsEyebrow} title={c.projectsTitle} lead={c.projectsLead} />
      <section className="container mx-auto px-6 py-24">
        {projects.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <h2 className="text-2xl font-bold">No projects published yet</h2>
            <p className="mt-3 text-muted-foreground">
              Project records, photos, and verified figures will appear here once published by the
              administration.
            </p>
            <Link to="/contact" className="mt-6 inline-flex rounded-full bg-secondary px-6 py-3 font-semibold text-secondary-foreground">
              Contact us
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <article key={p.id} className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
                {p.image && <img src={p.image} alt={p.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />}
                <div className="p-6">
                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-secondary">
                    <span>{p.status}</span>
                    {p.location && <span className="text-muted-foreground normal-case tracking-normal">{p.location}</span>}
                  </div>
                  <h2 className="mt-3 text-2xl font-bold leading-tight">{p.title}</h2>
                  {p.summary && <p className="mt-3 text-muted-foreground">{p.summary}</p>}
                  {p.body && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{p.body}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Projects;
