import raw from "../../books.json";

export type Book = {
  slug: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  year: number | null;
  language: string | null;
  topics: string[];
  level: "beginner" | "intermediate" | "advanced" | null;
  free_link: string | null;
  free_link_note: string | null;
  info_link: string | null;
  companion_repo?: string | null;
  cover?: string | null; // path to the real cover in public/covers (from Open Library); generated cover if missing
  cover_color?: string | null; // the cover's colour, deepened for text on top (see coverBack)
  gist?: string | null; // one or two sentences on what the book is about
  isbn?: string | null;
  borderline?: boolean;
};

// Borderline books stay off the public site until they're decided.
export const books = (raw as Book[]).filter((b) => !b.borderline);

const bySlug = new Map(books.map((b) => [b.slug, b]));

export function getBook(slug: string): Book | undefined {
  return bySlug.get(slug);
}

const years = books.map((b) => b.year).filter((y): y is number => y != null);

export const stats = {
  count: books.length,
  free: books.filter((b) => b.free_link).length,
  firstYear: Math.min(...years),
  lastYear: Math.max(...years),
  languages: new Set(books.map((b) => b.language).filter(Boolean)).size,
};
