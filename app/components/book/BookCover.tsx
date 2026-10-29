import { useState, type CSSProperties } from "react";
import type { Book } from "~/lib/books";
import { BitcoinMark } from "~/components/ui/BitcoinMark";

const colors: Record<string, string> = {
  economics: "#6b1f1f", technical: "#24305a", programming: "#1f3b2d",
  history: "#6a4414", lightning: "#43205a", philosophy: "#4a1f2a",
  fiction: "#2f3a1c", "self-custody": "#2b3d45",
};

export function topicColor(book: Book) {
  return colors[book.topics[0]] ?? "#3b2a1a";
}

// The back of a book, matched to its front: the real cover's dominant colour when there is
// one (otherwise the generated cover's topic colour), with dark ink on light covers and
// light ink on dark ones.
export function coverBack(book: Book) {
  const bg = book.cover && book.cover_color ? book.cover_color : topicColor(book);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16) / 255);
  const light = 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55;
  return light
    ? { backgroundColor: bg, color: "#2a1a10", accent: "#7a4a12" }
    : { backgroundColor: bg, color: "#efe3c8", accent: "#d9a441" };
}

// Inline style for a back face: colours, plus the accent as a CSS variable for headings.
export function backStyle(book: Book) {
  const { backgroundColor, color, accent } = coverBack(book);
  return { backgroundColor, color, "--accent": accent } as CSSProperties;
}

// The real cover when we have one. The generated cover is always drawn underneath, so a card
// is never blank while the image loads (or if it fails); the image fades in on top.
export function BookCover({ book }: { book: Book }) {
  const [loaded, setLoaded] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const showImage = book.cover && failed !== book.cover;
  return (
    <div className="relative aspect-2/3 w-full overflow-hidden rounded-r-sm shadow-[0_12px_30px_#0005]">
      <GeneratedCover book={book} />
      {showImage && (
        <>
          <img
            src={book.cover!}
            alt={`Cover of ${book.title}`}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(book.cover!)}
            onError={() => setFailed(book.cover!)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${loaded === book.cover ? "opacity-100" : "opacity-0"}`}
          />
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 shadow-[inset_5px_0_8px_#0004,inset_0_0_0_1px_#ffffff20]" />
        </>
      )}
    </div>
  );
}

function GeneratedCover({ book }: { book: Book }) {
  return (
    <div className="absolute inset-0 flex flex-col @container p-3 text-parchment shadow-[inset_7px_0_12px_#0006]" style={{ backgroundColor: topicColor(book) }}>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-between border border-gold/60 px-3 py-5 text-center">
        <span className="mt-2 line-clamp-5 font-heading text-[clamp(0.85rem,8cqw,1.4rem)] leading-snug wrap-anywhere">{book.title}</span>
        <span className="grid size-[clamp(1.75rem,16cqw,3rem)] shrink-0 place-items-center rounded-full border border-gold/70 text-gold shadow-[0_0_0_3px_#0000,0_0_0_4px_rgb(217_164_65/0.35)]">
          <BitcoinMark className="size-[62%]" />
        </span>
        <span className="mt-2 line-clamp-2 text-sm leading-tight text-parchment/80">{book.authors.join(", ")}</span>
        <span className="mt-3 text-xs text-gold">{book.year ?? "Undated"}</span>
      </div>
    </div>
  );
}
