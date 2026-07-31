/**
 * Pulls published website content from the backend on app start so every visitor
 * sees what Admin/Superadmin published — not just the browser that edited it.
 */
import { pullAllDocs } from "./content-sync";
import { applyRemoteBrand } from "./brand";
import { applyRemoteHero } from "./hero-store";
import { applyRemoteTeam } from "./team-store";
import { applyRemoteSite } from "./site-content";

let started = false;

export function hydratePublicContent(): void {
  if (started) return;
  started = true;
  void (async () => {
    const docs = await pullAllDocs();
    if (!docs) return;
    applyRemoteBrand(docs.brand);
    applyRemoteHero(docs.hero);
    applyRemoteTeam(docs.team);
    applyRemoteSite(docs.site);
  })();
}
