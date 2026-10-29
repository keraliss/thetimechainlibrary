import { useState } from "react";
import type { Book } from "~/lib/books";
import { BookCover, backStyle } from "./BookCover";
import "./flipping-cover.css";

export function FlippingCover({ book }: { book: Book }) {
  const [flipped, setFlipped] = useState(false);
  return <button type="button" className={`book-flip relative block aspect-2/3 w-full text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${flipped ? "is-flipped" : ""}`}
    aria-label={`About ${book.title}. Tap to turn the cover.`} onClick={() => setFlipped(!flipped)}>
    <span className="book-flip-front absolute inset-0"><BookCover book={book} /></span>
    <span className="book-flip-back absolute inset-0 flex flex-col justify-center overflow-y-auto border border-gold/50 p-6 shadow-[inset_7px_0_12px_#0004]" style={backStyle(book)}>
      <span className="font-heading text-xl text-(--accent)">About this book</span>
      {book.gist ? <span className="mt-5 text-lg leading-relaxed">{book.gist}</span> : <>
        {book.subtitle && <span className="mt-5 text-lg italic">{book.subtitle}</span>}
        <span className="mt-4 capitalize">{book.topics.join(" · ").replaceAll("-", " ")}</span>
        <span className="mt-5 opacity-75">No summary yet.</span>
      </>}
    </span>
  </button>;
}
