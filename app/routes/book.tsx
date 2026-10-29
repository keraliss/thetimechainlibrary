import { motion, useReducedMotion } from "motion/react";
import { data, isRouteErrorResponse, Link, useLocation, useNavigate } from "react-router";
import type { Route } from "./+types/book";
import { books, getBook } from "~/lib/books";
import { FlippingCover } from "~/components/book/FlippingCover";
import { BookCover } from "~/components/book/BookCover";

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  const book = getBook(params.slug);
  if (!book) throw data(null, { status: 404 });
  return { book };
}

export function meta({ data: loaderData }: Route.MetaArgs) {
  const book = loaderData?.book;
  return [
    { title: `${book?.title ?? "Book not found"} · The Timechain Library` },
    { name: "description", content: book ? `${book.title}${book.subtitle ? `: ${book.subtitle}` : ""} by ${book.authors.join(", ")}. Explore this Bitcoin book and discover related reading at The Timechain Library.` : "Find your next Bitcoin book in The Timechain Library." },
  ];
}

const background = "min-h-screen bg-[radial-gradient(ellipse_at_top_left,#80531e33,transparent_55%),linear-gradient(135deg,var(--color-wood),var(--color-night)_75%)] px-5 py-10 text-parchment sm:px-10 sm:py-16";
const external = "inline-flex items-center justify-center rounded border border-gold px-6 py-3 font-heading text-sm text-gold transition-colors hover:bg-gold hover:text-night focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";

export default function BookPage({ loaderData }: Route.ComponentProps) {
  const { book } = loaderData;
  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const related = books.filter((candidate) => candidate.slug !== book.slug && candidate.topics.some((topic) => book.topics.includes(topic)))
    .sort((a, b) => Number(b.authors.some((author) => book.authors.includes(author))) - Number(a.authors.some((author) => book.authors.includes(author))) || a.title.localeCompare(b.title)).slice(0, 6);
  const entrance = { initial: { opacity: 0, y: reduceMotion ? 0 : 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: reduceMotion ? 0.15 : 0.55 } };
  return (
    <main className={background}>
      <div className="mx-auto max-w-6xl">
        <Link to="/#stacks" className="text-gold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-gold" onClick={(event) => {
          if (location.state?.fromLibrary && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
            event.preventDefault();
            navigate(-1);
          }
        }}>← Back to the library</Link>
        <div className="mt-10 grid min-w-0 gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] md:gap-16">
          <motion.div {...entrance} className="mx-auto w-full max-w-xs md:max-w-sm"><FlippingCover key={book.slug} book={book} /></motion.div>
          <motion.div {...entrance} transition={{ ...entrance.transition, delay: reduceMotion ? 0 : 0.1 }} className="min-w-0 self-center">
            <p className="font-heading text-xs tracking-[0.3em] text-gold">FROM THE STACKS</p>
            <h1 className="mt-4 font-display text-3xl leading-tight [overflow-wrap:anywhere] sm:text-5xl">{book.title}</h1>
            {book.subtitle && <p className="mt-4 text-xl text-parchment/70 italic sm:text-2xl">{book.subtitle}</p>}
            <p className="mt-5 text-xl">By {book.authors.join(", ")}</p>
            {book.gist && <p className="mt-5 text-lg leading-relaxed text-parchment/80">{book.gist}</p>}
            <dl className="mt-8 grid grid-cols-3 gap-3 border-y border-gold/20 py-5">
              {[["Published", book.year ?? "Unknown"], ["Language", book.language ?? "Unknown"], ["Level", book.level ?? "Unspecified"]].map(([label, value]) => <div key={label}><dt className="text-sm text-gold">{label}</dt><dd className="mt-1 break-words capitalize">{value}</dd></div>)}
            </dl>
            <ul aria-label="Topics" className="mt-5 flex flex-wrap gap-2">{book.topics.map((topic) => <li key={topic} className="rounded-full border border-gold/30 px-3 py-1 text-sm capitalize text-parchment/80">{topic.replaceAll("-", " ")}</li>)}</ul>
            <div className="mt-8 flex flex-wrap gap-3">
              {book.free_link && <a href={book.free_link} target="_blank" rel="noopener noreferrer" className={`${external} bg-gold text-night`}>Read free ↗</a>}
              {book.info_link && <a href={book.info_link} target="_blank" rel="noopener noreferrer" className={external}>Get the book ↗</a>}
            </div>
            {book.free_link && book.free_link_note && <p className="mt-3 text-sm text-parchment/65">{book.free_link_note}</p>}
            {!book.free_link && !book.info_link && <p className="text-parchment/65">No link is known yet for this book.</p>}
            {book.companion_repo && <a href={book.companion_repo} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block text-gold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-gold">Companion code ↗</a>}
          </motion.div>
        </div>
        {related.length > 0 && <section className="mt-20 border-t border-gold/20 pt-10" aria-labelledby="related-title">
          <p className="text-xs tracking-[0.3em] text-gold">KEEP EXPLORING</p>
          <h2 id="related-title" className="mt-3 font-heading text-2xl">Nearby on the shelves</h2>
          <div className="mt-7 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">{related.map((candidate) => <Link key={candidate.slug} to={`/books/${candidate.slug}`} className="min-w-0 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
            <BookCover book={candidate} /><h3 className="mt-3 font-heading text-sm text-gold">{candidate.title}</h3><p className="mt-1 text-sm text-parchment/65">{candidate.authors.join(", ")}</p>
          </Link>)}</div>
        </section>}
      </div>
    </main>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const missing = isRouteErrorResponse(error) && error.status === 404;
  return <main className={`${background} grid place-items-center`}><div className="max-w-lg text-center">
    <p className="font-heading text-sm tracking-widest text-gold">THE TIMECHAIN LIBRARY</p>
    <h1 className="mt-5 font-display text-3xl">{missing ? "This book has wandered off" : "We couldn’t open this book"}</h1>
    <p className="mt-4 text-lg text-parchment/70">{missing ? "We couldn’t find that title in our catalog. There are plenty of other stories waiting on the shelves." : "Please try again, or return to the stacks to find another title."}</p>
    <Link to="/#stacks" className={`${external} mt-7`}>Back to the library</Link>
  </div></main>;
}
