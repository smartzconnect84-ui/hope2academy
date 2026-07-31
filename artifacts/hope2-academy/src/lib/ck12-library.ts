/**
 * CK-12 Digital Library store.
 *
 * Replaces the legacy physical "Library" catalog. Books point at CK-12
 * FlexBook resources: when a title is marked embeddable we render it inline in
 * an iframe, otherwise we open the official CK-12 page in a new tab.
 *
 * Catalog is shared (Admin/Teacher managed); bookmarks and reading progress
 * are stored per signed-in user.
 */
import { useEffect, useState } from "react";

export const CK12_SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Social Studies",
  "Computer Science",
  "Others",
] as const;
export type Ck12Subject = (typeof CK12_SUBJECTS)[number];

export const GRADE_LEVELS = [
  "ABC", "Kindergarten",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
];

export interface Ck12Chapter {
  id: string;
  title: string;
  url?: string;
}

export interface Ck12Book {
  id: string;
  title: string;
  subject: Ck12Subject;
  grade: string;
  description: string;
  cover?: string;
  url: string;
  /** CK-12 permits inline embedding for this resource. */
  embeddable?: boolean;
  chapters?: Ck12Chapter[];
}

export interface ReadingState {
  bookmarked: boolean;
  progress: number; // 0-100
  updatedAt: string;
}

const CATALOG_KEY = "h2a.ck12.catalog.v1";
const READING_KEY = "h2a.ck12.reading.v1";

const ck = (id: string, title: string, subject: Ck12Subject, grade: string, description: string, url: string, chapters: string[], embeddable = false): Ck12Book => ({
  id, title, subject, grade, description, url, embeddable,
  chapters: chapters.map((c, i) => ({ id: `${id}-c${i + 1}`, title: c })),
});

export const DEFAULT_CATALOG: Ck12Book[] = [
  ck("ck-alg1", "CK-12 Algebra I (FlexBook 2.0)", "Mathematics", "Grade 9",
    "Expressions, linear equations, inequalities, functions, systems and quadratics with worked examples and practice.",
    "https://www.ck12.org/book/ck-12-algebra-i-second-edition/",
    ["Equations and Functions", "Real Numbers", "Linear Equations", "Graphs of Linear Equations", "Systems of Equations", "Quadratic Equations"]),
  ck("ck-basic-math", "CK-12 Basic Arithmetic", "Mathematics", "Grade 6",
    "Whole numbers, fractions, decimals, ratios and percentages — the foundation for junior secondary maths.",
    "https://www.ck12.org/book/ck-12-basic-arithmetic-concepts/",
    ["Whole Numbers", "Fractions", "Decimals", "Ratios and Rates", "Percent"]),
  ck("ck-geometry", "CK-12 Geometry", "Mathematics", "Grade 10",
    "Points, lines, triangles, congruence, similarity, circles and area & volume.",
    "https://www.ck12.org/book/ck-12-geometry-concepts/",
    ["Basics of Geometry", "Reasoning and Proof", "Triangles", "Similarity", "Circles", "Perimeter and Area"]),
  ck("ck-bio", "CK-12 Biology", "Science", "Grade 10",
    "Cells, genetics, evolution, human biology and ecology aligned to secondary science.",
    "https://www.ck12.org/book/ck-12-biology-concepts/",
    ["Introduction to Biology", "Cell Biology", "Genetics", "Evolution", "Human Biology", "Ecology"]),
  ck("ck-chem", "CK-12 Chemistry", "Science", "Grade 11",
    "Matter, atomic structure, the periodic table, bonding, reactions and stoichiometry.",
    "https://www.ck12.org/book/ck-12-chemistry-concepts-intermediate/",
    ["Matter and Change", "Atomic Structure", "The Periodic Table", "Chemical Bonding", "Chemical Reactions", "Stoichiometry"]),
  ck("ck-physics", "CK-12 Physics — Concepts", "Science", "Grade 12",
    "Motion, forces, energy, waves, electricity and magnetism with real-world problems.",
    "https://www.ck12.org/book/ck-12-physics-concepts-intermediate/",
    ["Motion", "Forces", "Energy", "Waves and Sound", "Electricity", "Magnetism"]),
  ck("ck-earth", "CK-12 Earth Science", "Science", "Grade 8",
    "Earth systems, rocks and minerals, weather, climate and natural resources.",
    "https://www.ck12.org/book/ck-12-earth-science-concepts-for-middle-school/",
    ["Studying Earth", "Rocks and Minerals", "Plate Tectonics", "Weather", "Climate", "Earth's Resources"]),
  ck("ck-life-science", "CK-12 Life Science", "Science", "Grade 7",
    "Living things, cells, plants, animals and human body systems for junior secondary learners.",
    "https://www.ck12.org/book/ck-12-life-science-concepts-for-middle-school/",
    ["What is Life Science", "Cells", "Plants", "Animals", "The Human Body"]),
  ck("ck-english", "CK-12 English Language Arts", "English", "Grade 9",
    "Reading comprehension, literary analysis, grammar, vocabulary and essay writing.",
    "https://www.ck12.org/book/basic-speller/",
    ["Reading Strategies", "Literary Elements", "Grammar and Usage", "Vocabulary", "Writing Essays"]),
  ck("ck-writing", "CK-12 Writing & Composition", "English", "Grade 11",
    "Paragraph structure, argument, research writing and citation practice.",
    "https://www.ck12.org/book/ck-12-basic-english-grammar/",
    ["The Writing Process", "Paragraphs", "Argument Writing", "Research and Citation"]),
  ck("ck-history", "CK-12 World History", "Social Studies", "Grade 10",
    "Early civilisations through the modern era, with an emphasis on Africa and the wider world.",
    "https://www.ck12.org/book/ck-12-human-geography-for-high-school/",
    ["Early Civilisations", "Empires and Trade", "Africa in World History", "Revolutions", "The Modern World"]),
  ck("ck-geography", "CK-12 Human Geography", "Social Studies", "Grade 9",
    "Population, migration, culture, development and the geography of West Africa.",
    "https://www.ck12.org/book/ck-12-human-geography-for-high-school/",
    ["Maps and Places", "Population", "Migration", "Culture", "Development"]),
  ck("ck-civics", "CK-12 Civics & Government", "Social Studies", "Grade 8",
    "Citizenship, the branches of government, rights and civic responsibility.",
    "https://www.ck12.org/book/ck-12-history-of-the-us-government/",
    ["Citizenship", "Branches of Government", "Rights and Duties", "Elections"]),
  ck("ck-cs", "CK-12 Computer Science — Python", "Computer Science", "Grade 10",
    "Programming fundamentals in Python: variables, control flow, functions and data.",
    "https://www.ck12.org/c/programming/",
    ["Getting Started", "Variables and Types", "Control Flow", "Functions", "Lists and Loops", "Mini Projects"]),
  ck("ck-digital", "CK-12 Digital Literacy & Computing", "Computer Science", "Grade 7",
    "Computer basics, internet safety, productivity tools and responsible online behaviour.",
    "https://www.ck12.org/c/engineering/",
    ["Computer Basics", "The Internet", "Online Safety", "Productivity Tools"]),
  ck("ck-study-skills", "CK-12 Study Skills & Exam Prep", "Others", "Grade 12",
    "Note-taking, revision planning and exam technique for WASSCE preparation.",
    "https://www.ck12.org/student/",
    ["Note-taking", "Revision Planning", "Practice Testing", "Exam Day"]),
  ck("ck-health", "CK-12 Health & Wellness", "Others", "Grade 6",
    "Nutrition, hygiene, physical activity and personal wellbeing.",
    "https://www.ck12.org/c/health/",
    ["Nutrition", "Hygiene", "Physical Activity", "Mental Wellbeing"]),
];

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("ck12:changed"));
}

type ReadingMap = Record<string, Record<string, ReadingState>>;

export const ck12Store = {
  list(): Ck12Book[] {
    const stored = read<Ck12Book[] | null>(CATALOG_KEY, null);
    if (!stored || stored.length === 0) {
      write(CATALOG_KEY, DEFAULT_CATALOG);
      return DEFAULT_CATALOG;
    }
    return stored;
  },
  save(books: Ck12Book[]) {
    write(CATALOG_KEY, books);
  },
  upsert(book: Ck12Book) {
    const all = ck12Store.list();
    const i = all.findIndex((b) => b.id === book.id);
    if (i >= 0) all[i] = book;
    else all.unshift(book);
    write(CATALOG_KEY, all);
  },
  remove(id: string) {
    write(CATALOG_KEY, ck12Store.list().filter((b) => b.id !== id));
  },
  reset() {
    write(CATALOG_KEY, DEFAULT_CATALOG);
  },

  reading(userId: string): Record<string, ReadingState> {
    return read<ReadingMap>(READING_KEY, {})[userId] ?? {};
  },
  setReading(userId: string, bookId: string, patch: Partial<ReadingState>) {
    const map = read<ReadingMap>(READING_KEY, {});
    const mine = map[userId] ?? {};
    const current = mine[bookId] ?? { bookmarked: false, progress: 0, updatedAt: "" };
    mine[bookId] = { ...current, ...patch, updatedAt: new Date().toISOString() };
    map[userId] = mine;
    write(READING_KEY, map);
  },
};

/** Reactive catalog + reading state for the signed-in user. */
export function useCk12(userId: string | null) {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener("ck12:changed", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("ck12:changed", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);
  const books = ck12Store.list();
  const reading = userId ? ck12Store.reading(userId) : {};
  return { books, reading, version };
}

export const SUBJECT_TONE: Record<Ck12Subject, string> = {
  Mathematics: "from-primary/85 to-primary",
  Science: "from-emerald-500/80 to-emerald-700",
  English: "from-amber-500/80 to-amber-700",
  "Social Studies": "from-sky-500/80 to-sky-700",
  "Computer Science": "from-violet-500/80 to-violet-700",
  Others: "from-muted-foreground/60 to-foreground/70",
};