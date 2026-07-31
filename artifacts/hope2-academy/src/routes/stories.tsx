import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { publicForms } from "@/lib/public-forms";
import { PageHeader } from "@/components/PageHeader";

function Stories() {

  const [email, setEmail] = useState("");
  function onSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email)) { toast.error("Enter a valid email address."); return; }
    publicForms.subscribe(email);
    setEmail("");
    toast.success("You're subscribed — field updates land in your inbox monthly.");
  }
  return (
    <div>
      <PageHeader eyebrow="Field Updates & Stories" title="Voices from the ground" lead="Authentic reports from the communities, classrooms, and clinics where we serve." />
      <section className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <h2 className="text-2xl font-bold">No stories published yet</h2>
          <p className="mt-3 text-muted-foreground">
            Field updates and school news will appear here once the HOPE2 MEDIA team publishes them
            from the portal.
          </p>
        </div>
      </section>
      <section className="bg-muted py-20">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <h2 className="text-4xl font-bold">Want stories in your inbox?</h2>
          <p className="mt-3 text-muted-foreground">We send one field update each month — no spam, just real news from Liberia.</p>
          <form onSubmit={onSubscribe} className="mt-8 flex flex-col sm:flex-row gap-3">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="flex-1 rounded-full px-6 py-4 bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
            <button type="submit" className="rounded-full bg-primary text-primary-foreground px-7 py-4 font-semibold">Subscribe</button>
          </form>
          <Link to="/get-involved" className="mt-6 inline-block text-primary font-semibold">Or get involved directly →</Link>
        </div>
      </section>
    </div>
  );
}

export default Stories;
