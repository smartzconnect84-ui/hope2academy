import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";

function Projects() {
  return (
    <div>
      <PageHeader
        eyebrow="Our Work"
        title="Projects you can see, count, and trust"
        lead="Verified project reports from HOPE2 ACADEMY and its divisions are published here."
      />
      <section className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <h2 className="text-2xl font-bold">No projects published yet</h2>
          <p className="mt-3 text-muted-foreground">
            Project records, photos, and verified figures will appear here once published by the
            administration.
          </p>
          <Link to="/contact" className="mt-6 inline-flex rounded-full bg-secondary text-secondary-foreground px-6 py-3 font-semibold">
            Contact us
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Projects;
