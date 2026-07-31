/**
 * Team members store — persistent, editable team roster for the public Team page.
 * Editable by Superadmin & Admin via the in-portal Team Editor module.
 */
import { useEffect, useState } from "react";
import { pushDoc } from "./content-sync";

export interface TeamMember {
  id: string;
  img: string;
  name: string;
  role: string;
  bio?: string;
  email?: string;
  linkedin?: string;
  enabled: boolean;
}

export interface TeamPageContent {
  eyebrow: string;
  title: string;
  lead: string;
  sectionHeading: string;
  sectionLead: string;
  quote: string;
  quoteAuthor: string;
  members: TeamMember[];
}

const KEY = "h2l.team.v2";

export const DEFAULT_TEAM: TeamPageContent = {
  eyebrow: "Our People",
  title: "The hands, hearts, and minds behind the mission.",
  lead: "A Liberian-led team of educators, ministers, and community builders serving from Marshall Road, Lower Margibi County.",
  sectionHeading: "Meet the leadership",
  sectionLead: "Team profiles are published by the HOPE2 ACADEMY administration.",
  quote: "Learning To Serve For God's Purpose.",
  quoteAuthor: "— HOPE2 ACADEMY",
  members: [],
};

function isBrowser() { return typeof window !== "undefined" && typeof localStorage !== "undefined"; }

function read(): TeamPageContent {
  if (!isBrowser()) return DEFAULT_TEAM;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_TEAM;
    const parsed = JSON.parse(raw) as Partial<TeamPageContent>;
    return { ...DEFAULT_TEAM, ...parsed, members: parsed.members ?? DEFAULT_TEAM.members };
  } catch { return DEFAULT_TEAM; }
}
function write(v: TeamPageContent) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent("h2l.team.change"));
  pushDoc("team", v);
}

export const teamStore = {
  get(): TeamPageContent { return read(); },
  setContent(patch: Partial<Omit<TeamPageContent, "members">>) {
    const next = { ...read(), ...patch }; write(next); return next;
  },
  upsertMember(m: TeamMember) {
    const cur = read();
    const i = cur.members.findIndex(x => x.id === m.id);
    const members = [...cur.members];
    if (i === -1) members.push(m); else members[i] = m;
    write({ ...cur, members }); return members;
  },
  removeMember(id: string) {
    const cur = read(); write({ ...cur, members: cur.members.filter(x => x.id !== id) });
  },
  moveMember(id: string, dir: -1 | 1) {
    const cur = read(); const members = [...cur.members];
    const i = members.findIndex(x => x.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= members.length) return;
    [members[i], members[j]] = [members[j], members[i]]; write({ ...cur, members });
  },
  reset() { write(DEFAULT_TEAM); return DEFAULT_TEAM; },
  newId() { return `tm_${Math.random().toString(36).slice(2, 9)}`; },
};

export function useTeamContent(): TeamPageContent {
  const [v, setV] = useState<TeamPageContent>(() => read());
  useEffect(() => {
    const h = () => setV(read());
    window.addEventListener("h2l.team.change", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("h2l.team.change", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return v;
}
/** Apply a document published by the backend (server wins over the local cache). */
export function applyRemoteTeam(remote: unknown): void {
  if (!remote || !isBrowser()) return;
  try {
    const next = JSON.stringify(remote);
    if (localStorage.getItem(KEY) === next) return;
    localStorage.setItem(KEY, next);
    window.dispatchEvent(new CustomEvent("h2l.team.change"));
  } catch { /* ignore */ }
}
