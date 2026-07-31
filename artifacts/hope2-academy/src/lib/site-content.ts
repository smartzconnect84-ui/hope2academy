/**
 * Public website content store — Projects, Stories, Divisions (Departments)
 * and Homepage sections. Editable by Superadmin & Admin from the portal.
 * Persisted to localStorage and broadcast so public pages update live.
 */
import { useEffect, useState } from "react";
import missionAsset from "@/assets/departments/dept-mission.jpg.asset.json";
import academyAsset from "@/assets/departments/dept-academy.jpg.asset.json";
import churchAsset from "@/assets/departments/dept-church.jpg.asset.json";
import mediaAsset from "@/assets/departments/dept-media.jpg.asset.json";

export interface ProjectItem {
  id: string; title: string; summary: string; body: string;
  image: string; location: string; status: string; published: boolean;
}
export interface StoryItem {
  id: string; title: string; excerpt: string; body: string;
  image: string; category: string; author: string; date: string; published: boolean;
}
export interface DivisionItem {
  id: string; roman: string; pillar: string; title: string; tag: string;
  est: string; area: string; image: string;
  body: string;     // paragraphs separated by blank lines
  bullets: string;  // one per line
  published: boolean;
}
export interface HomeChapter {
  id: string; tag: string; title: string; body: string;
  statValue: string; statUnit: string; href: string; cta: string; image: string; alt: string;
}
export interface HomeCard { id: string; image: string; tag: string; title: string; href: string; }
export interface HomeContent {
  ribbon: { id: string; k: string; label: string }[];
  manifestoEyebrow: string;
  manifestoHeading: string;
  manifestoAccent: string;
  manifestoLead: string;
  chapters: HomeChapter[];
  quote: string;
  quoteAuthor: string;
  quoteSub: string;
  impactStats: { id: string; v: string; label: string }[];
  cardsEyebrow: string;
  cardsHeading: string;
  cards: HomeCard[];
}
export interface SiteContent {
  projects: ProjectItem[];
  projectsEyebrow: string; projectsTitle: string; projectsLead: string;
  stories: StoryItem[];
  storiesEyebrow: string; storiesTitle: string; storiesLead: string;
  divisions: DivisionItem[];
  divisionsEyebrow: string; divisionsTitle: string; divisionsLead: string;
  home: HomeContent;
}

const KEY = "h2l.sitecontent.v1";
const EVT = "h2l.sitecontent.change";

export const DEFAULT_CONTENT: SiteContent = {
  projects: [],
  projectsEyebrow: "Our Work",
  projectsTitle: "Projects you can see, count, and trust",
  projectsLead: "Verified project reports from HOPE2 ACADEMY and its divisions are published here.",
  stories: [],
  storiesEyebrow: "Field Updates & Stories",
  storiesTitle: "Voices from the ground",
  storiesLead: "Authentic reports from the communities, classrooms, and clinics where we serve.",
  divisionsEyebrow: "Our Four Divisions",
  divisionsTitle: "Four divisions. One unwavering mission.",
  divisionsLead: '"We do not bring solutions to Liberia. We build them, together, beside her people." — The HOPE2 Charter',
  divisions: [
    {
      id: "mission", roman: "I", pillar: "Division I — Compassion in motion",
      title: "HOPE2 MISSION", tag: "Hands and feet across Liberia.",
      est: "Marshall Road, Lower Margibi County", area: "Serving Margibi County, Liberia",
      image: missionAsset.url, published: true,
      body: [
        "HOPE2 MISSION is the humanitarian heart of our movement — mobile clinics, clean water, food security and disaster response carried directly to the communities of Margibi County and across Liberia.",
        "We work alongside local leaders to identify needs, design solutions, and measure results. Every project is co-built with the village it serves; nothing is imposed.",
        "Our mission teams operate from Marshall Road, Margibi — carrying health outreach, clean-water and relief work to nearby communities.",
      ].join("\n\n"),
      bullets: [
        "Mobile medical outreach across Margibi",
        "Clean-water boreholes & sanitation projects",
        "Food, clothing and emergency relief distribution",
        "Skills training for women and youth",
        "Partnerships with the Liberian Ministry of Health",
      ].join("\n"),
    },
    {
      id: "academy", roman: "II", pillar: "Division II — Learning that lasts a lifetime",
      title: "HOPE2 ACADEMY", tag: "Every child, a future.",
      est: "ABC through 12th Grade", area: "Marshall Road, Lower Margibi County, Liberia",
      image: academyAsset.url, published: true,
      body: [
        "HOPE2 ACADEMY — affectionately known as The Lizard Kingdom — is the K-12 Christian school that anchors the movement. Our motto: \"Learning To Serve For God's Purpose.\"",
        "Our program runs from ABC through 12th Grade — rigorous academics paired with character formation, sports, music and service learning.",
        "Every scholarship comes with a mentor and a six-month progress check. We measure success by attendance, literacy growth, and graduation.",
      ].join("\n\n"),
      bullets: [
        "Tuition & uniform support for enrolled students",
        "Solar-powered library and computer lab",
        "ABC-to-12th-Grade STEM, civics and Bible curriculum",
        "Annual scholarships for top secondary-school entrants",
        "Teacher development in early literacy & STEM",
      ].join("\n"),
    },
    {
      id: "church", roman: "III", pillar: "Division III — Worship, discipleship, community",
      title: "HOPE2 CHURCH", tag: "A house of prayer for all people.",
      est: "Marshall Road sanctuary", area: "Margibi County, Liberia",
      image: churchAsset.url, published: true,
      body: [
        "HOPE2 CHURCH is the spiritual home of the movement — local congregations that gather for worship, discipleship, prayer and pastoral care.",
        "We serve children's church, youth fellowships, women's and men's ministries, and outreach to the elderly and incarcerated across Margibi County.",
        "Every Sunday is open to anyone — student, parent, visitor, neighbour. Come as you are.",
      ].join("\n\n"),
      bullets: [
        "Weekly Sunday worship at the Marshall Road sanctuary",
        "Youth & children's discipleship classes",
        "Pastoral counselling and home visitation",
        "Community prayer & healing services",
        "Marriage, baptism and dedication ceremonies",
      ].join("\n"),
    },
    {
      id: "media", roman: "IV", pillar: "Division IV — Telling Liberia's story",
      title: "HOPE2 MEDIA", tag: "Stories that move hearts and hands.",
      est: "Radio, social, print & video", area: "Studio in Margibi County, Liberia",
      image: mediaAsset.url, published: true,
      body: [
        "HOPE2 MEDIA carries the voice of the movement — radio devotionals, short documentaries, social-media stories, and a quarterly print magazine produced from our Margibi studio.",
        "We train young Liberian writers, photographers and producers to tell their own stories — beautifully, honestly, and with hope.",
        "If you want to partner, sponsor, or contribute content, reach out via the Contact page.",
      ].join("\n\n"),
      bullets: [
        "Weekly radio program on Margibi community FM",
        "Documentary shorts on YouTube and Instagram",
        "Quarterly print magazine \"Hope For Liberia\"",
        "Training program for young Liberian journalists",
        "Live-streamed worship and special events",
      ].join("\n"),
    },
  ],
  home: {
    ribbon: [
      { id: "r1", k: "01", label: "Margibi, Liberia" },
      { id: "r2", k: "02", label: "ABC – Grade 12" },
      { id: "r3", k: "03", label: "Learning · Faith · Service" },
      { id: "r4", k: "04", label: "USD & LRD tuition" },
    ],
    manifestoEyebrow: "The HOPE2 movement",
    manifestoHeading: "Learning to serve,",
    manifestoAccent: "for God's purpose",
    manifestoLead:
      "HOPE2 ACADEMY is more than a school. It's an academy, a mission, a church, and a media house — four hands of one movement raising Liberia's next generation of leaders, healers, and storytellers.",
    chapters: [
      {
        id: "c1", tag: "Chapter 01 — Academy",
        title: "A classroom that raises leaders, not just students.",
        body: "From ABC through Grade 12, HOPE2 ACADEMY blends a rigorous Liberian curriculum with character formation, mentorship, and creative expression — so every child leaves prepared to serve their country.",
        statValue: "ABC–12", statUnit: "grades", href: "/departments", cta: "Explore the academy",
        image: academyAsset.url, alt: "HOPE2 Academy students in class",
      },
      {
        id: "c2", tag: "Chapter 02 — Mission",
        title: "We walk the villages before we build in them.",
        body: "Our Mission team lives inside the communities we serve across Margibi and beyond — listening first, then building water, food security, and family support programs alongside local leaders.",
        statValue: "Margibi", statUnit: "and beyond", href: "/projects", cta: "See the field work",
        image: missionAsset.url, alt: "HOPE2 Mission field team",
      },
      {
        id: "c3", tag: "Chapter 03 — Church",
        title: "Faith that shows up on Monday morning.",
        body: "HOPE2 Church is the heartbeat of the campus. Sunday worship, midweek discipleship, and pastoral care for staff and families keep our purpose — Learning To Serve For God's Purpose — alive every day.",
        statValue: "Sundays", statUnit: "open to all", href: "/about", cta: "Our story of faith",
        image: churchAsset.url, alt: "HOPE2 Church congregation",
      },
      {
        id: "c4", tag: "Chapter 04 — Media",
        title: "Telling Liberia's story in Liberia's voice.",
        body: "HOPE2 Media trains young creators in film, journalism, and design — documenting the movement, amplifying local heroes, and beaming lessons from Marshall Road to the rest of the world.",
        statValue: "Studio", statUnit: "Marshall Road", href: "/stories", cta: "Watch, read, listen",
        image: mediaAsset.url, alt: "HOPE2 Media student crew",
      },
    ],
    quote: "We are not raising graduates. We are raising people who will walk back into their villages and refuse to let them stay broken.",
    quoteAuthor: "HOPE2 ACADEMY",
    quoteSub: "Learning To Serve For God's Purpose",
    impactStats: [
      { id: "s1", v: "ABC–12", label: "Grades taught at the Marshall Road campus" },
      { id: "s2", v: "4", label: "Divisions: Mission, Academy, Church, Media" },
      { id: "s3", v: "Mon–Fri", label: "Office hours 7:00 AM – 4:00 PM" },
      { id: "s4", v: "USD + LRD", label: "Every fee, gift & scholarship in both" },
    ],
    cardsEyebrow: "Field notes",
    cardsHeading: "Stories from the movement",
    cards: [],
  },
};

function isBrowser() { return typeof window !== "undefined" && typeof localStorage !== "undefined"; }

function read(): SiteContent {
  if (!isBrowser()) return DEFAULT_CONTENT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONTENT;
    const p = JSON.parse(raw) as Partial<SiteContent>;
    return { ...DEFAULT_CONTENT, ...p, home: { ...DEFAULT_CONTENT.home, ...(p.home ?? {}) } };
  } catch { return DEFAULT_CONTENT; }
}
function write(v: SiteContent) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent(EVT));
}

type ListKey = "projects" | "stories" | "divisions";

export const siteContent = {
  get: read,
  patch(p: Partial<Omit<SiteContent, "home">>) { const next = { ...read(), ...p }; write(next); return next; },
  patchHome(p: Partial<HomeContent>) { const cur = read(); write({ ...cur, home: { ...cur.home, ...p } }); },
  upsert<K extends ListKey>(key: K, item: SiteContent[K][number]) {
    const cur = read();
    const list = [...(cur[key] as any[])];
    const i = list.findIndex((x) => x.id === (item as any).id);
    if (i === -1) list.push(item); else list[i] = item;
    write({ ...cur, [key]: list } as SiteContent);
  },
  remove(key: ListKey, id: string) {
    const cur = read();
    write({ ...cur, [key]: (cur[key] as any[]).filter((x) => x.id !== id) } as SiteContent);
  },
  move(key: ListKey, id: string, dir: -1 | 1) {
    const cur = read();
    const list = [...(cur[key] as any[])];
    const i = list.findIndex((x) => x.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    write({ ...cur, [key]: list } as SiteContent);
  },
  reset() { write(DEFAULT_CONTENT); return DEFAULT_CONTENT; },
  newId(prefix = "it") { return `${prefix}_${Math.random().toString(36).slice(2, 9)}`; },
};

export function useSiteContent(): SiteContent {
  const [v, setV] = useState<SiteContent>(() => read());
  useEffect(() => {
    const h = () => setV(read());
    window.addEventListener(EVT, h);
    window.addEventListener("storage", h);
    return () => { window.removeEventListener(EVT, h); window.removeEventListener("storage", h); };
  }, []);
  return v;
}
