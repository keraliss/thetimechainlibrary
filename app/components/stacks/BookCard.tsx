import { useState } from "react";
import { Link } from "react-router";
import type { Book } from "~/lib/books";
import { BookCover, backStyle } from "~/components/book/BookCover";

export function BookCard({ book }: { book: Book }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <Link to={`/books/${book.slug}`} state={{ fromLibrary: true }} aria-label={`${book.title} by ${book.authors.join(", ")}. Open book details`}
      className={`catalog-card block min-w-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${flipped ? "is-flipped" : ""}`}
      onClick={(event) => {
        if (window.matchMedia("(hover: none)").matches && !flipped && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          setFlipped(true);
        }
      }}>
      <div className="catalog-card-inner relative aspect-[2/3]">
        <div className="catalog-front absolute inset-0" aria-hidden="true"><BookCover book={book} /></div>
        <div className="catalog-back absolute inset-0 flex flex-col overflow-y-auto border border-gold/50 p-4 text-sm" style={backStyle(book)}>
          <h3 className="font-heading text-base text-(--accent)">{book.title}</h3>
          {book.gist && <p className="mt-3 line-clamp-4 opacity-90">{book.gist}</p>}
          <p className="mt-3">{book.authors.join(", ")}</p>
          <p className="mt-2 capitalize opacity-75">{[book.year ?? "Undated", book.level].filter(Boolean).join(" · ")}</p>
          <p className="mt-3 capitalize opacity-75">{book.topics.join(" · ")}</p>
          {book.free_link && <span className="mt-3 text-ember">● Free to read</span>}
          <span className="mt-auto pt-4 text-(--accent)">Open book →</span>
        </div>
      </div>
      <p className="mt-3 font-heading text-sm leading-relaxed">{book.title}</p>
    </Link>
  );
}
