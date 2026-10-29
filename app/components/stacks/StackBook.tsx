import { useId, useState } from "react";
import { Link } from "react-router";
import type { Book } from "~/lib/books";
import { BookCover } from "~/components/book/BookCover";

export function StackBook({ book }: { book: Book }) {
  const [active, setActive] = useState(false);
  const caption = useId();
  return <div className={`catalog-stack-slot ${active ? "is-active" : ""}`}>
    <Link to={`/books/${book.slug}`} state={{ fromLibrary: true }}
      aria-label={`${book.title} by ${book.authors.join(", ")}. Open book details`}
      aria-describedby={caption} className="catalog-stack-book block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
      onBlur={() => setActive(false)} onPointerLeave={(event) => { if (event.pointerType === "mouse") setActive(false); }}
      onClick={(event) => {
        if (window.matchMedia("(hover: none)").matches && !active && event.detail !== 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
          event.preventDefault();
          setActive(true);
        }
      }}>
      <BookCover book={book} />
    </Link>
    <div id={caption} className="catalog-stack-caption">
      <p className="line-clamp-2 font-heading text-sm text-gold">{book.title}</p>
      <p className="mt-1 line-clamp-2 text-xs">{book.authors.join(", ")}</p>
      <p className="mt-1 text-xs text-parchment/70">{book.year ?? "Undated"}</p>
      {book.free_link && <span className="mt-1 inline-block text-xs text-ember">● Free to read</span>}
    </div>
  </div>;
}
