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
  cover?: string | null; // path to the real cover (WebP) in public/covers (from Open Library); generated cover if missing
  cover_color?: string | null; // the cover's main colour, for its back (see coverBack)
  gist?: string | null; // one or two sentences on what the book is about
  isbn?: string | null;
  amazon_asin?: string | null; // the book's Amazon product id (the 10 characters after /dp/ in its Amazon URL)
  borderline?: boolean;
};

// Borderline books stay off the public site until they're decided. Cover paths in books.json
// are from the site root; the site may be served from a folder (BASE_URL, e.g. on GitHub Pages).
export const books = (raw as Book[])
  .filter((b) => !b.borderline)
  .map((b) => (b.cover ? { ...b, cover: import.meta.env.BASE_URL + b.cover.replace(/^\//, "") } : b));

const bySlug = new Map(books.map((b) => [b.slug, b]));

export function getBook(slug: string): Book | undefined {
  return bySlug.get(slug);
}

// Ways to reach any book, even one without a link of its own: compare sellers (new and used),
// find it in a nearby library, or borrow a digital copy. By ISBN when we have one.
export function findLinks(book: Book) {
  const q = encodeURIComponent(`${book.title} ${book.authors[0] ?? ""}`.trim());
  return {
    sellers: book.isbn ? `https://www.bookfinder.com/isbn/${book.isbn}/` : `https://www.bookfinder.com/search/?keywords=${q}`,
    library: `https://search.worldcat.org/search?q=${book.isbn ? `bn:${book.isbn}` : q}`,
    openLibrary: `https://openlibrary.org/search?q=${book.isbn ?? q}`,
  };
}

// Amazon Associates. Put your tracking ID in `tag` (for amazon.in it ends in -21); while it's
// null, book pages show no Amazon button. Links go straight to the book when we know its ASIN,
// otherwise to an Amazon search for it (purchases from there still count).
export const AMAZON = {
  store: "https://www.amazon.in",
  tag: "priyastylesyo-21" as string | null,
};

const isAmazon = (url: string | null) => url != null && /^https?:\/\/(www\.)?amazon\./.test(url);

export function amazonLink(book: Book): { href: string; direct: boolean } | null {
  if (!AMAZON.tag) return null;
  const tag = `tag=${encodeURIComponent(AMAZON.tag)}`;
  const asin = book.amazon_asin ?? (isAmazon(book.info_link) ? book.info_link!.match(/\/dp\/([A-Z0-9]{10})/)?.[1] : null);
  if (asin) return { href: `${AMAZON.store}/dp/${asin}?${tag}`, direct: true };
  const q = encodeURIComponent(`${book.title} ${book.authors[0] ?? ""}`.trim());
  return { href: `${AMAZON.store}/s?k=${q}&i=stripbooks&${tag}`, direct: false };
}

// When the book's own link is an (untagged) Amazon page, the Amazon button stands in for it.
export function infoLink(book: Book) {
  return AMAZON.tag && isAmazon(book.info_link) ? null : book.info_link;
}

const years = books.map((b) => b.year).filter((y): y is number => y != null);

export const stats = {
  count: books.length,
  free: books.filter((b) => b.free_link).length,
  firstYear: Math.min(...years),
  lastYear: Math.max(...years),
  languages: new Set(books.map((b) => b.language).filter(Boolean)).size,
};
