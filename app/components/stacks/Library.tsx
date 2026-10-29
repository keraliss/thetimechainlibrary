import Fuse from "fuse.js";
import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { books } from "~/lib/books";
import { StackBook } from "./StackBook";
import { BookCard } from "./BookCard";
import "./library.css";

const topics = [...new Set(books.flatMap((book) => book.topics))].sort();
const languages = [...new Set(books.flatMap((book) => book.language ? [book.language] : []))].sort();
const decades = [...new Set(books.flatMap((book) => book.year ? [String(Math.floor(book.year / 10) * 10)] : []))].sort();
const search = new Fuse(books, { keys: ["title", "subtitle", "authors"], threshold: 0.35 });
const control = "min-w-0 rounded border border-gold/30 bg-night px-3 py-2 text-parchment focus-visible:outline-2 focus-visible:outline-gold";

export function Library() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const selectedTopics = params.getAll("topic");
  const grid = params.get("view") === "grid";
  function update(key: string, value: string) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value); else next.delete(key);
      return next;
    }, { replace: true, preventScrollReset: true });
  }
  const results = useMemo(() => {
    const selected = params.getAll("topic");
    const filtered = (query.trim() ? search.search(query).map(({ item }) => item) : [...books]).filter((book) =>
      (!selected.length || selected.some((topic) => book.topics.includes(topic))) &&
      (!params.get("level") || book.level === params.get("level")) &&
      (!params.get("language") || book.language === params.get("language")) &&
      (!params.get("decade") || (book.year != null && String(Math.floor(book.year / 10) * 10) === params.get("decade"))) &&
      (params.get("free") !== "1" || !!book.free_link));
    const sort = params.get("sort") ?? "featured";
    return filtered.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      // Featured: books with a real cover first, then ones with a summary; newest within each.
      if (sort === "featured") {
        const rank = (x: typeof a) => (x.cover ? 0 : x.gist ? 1 : 2);
        const r = rank(a) - rank(b);
        if (r) return r;
      }
      if (a.year == null) return b.year == null ? a.title.localeCompare(b.title) : 1;
      if (b.year == null) return -1;
      return (sort === "oldest" ? a.year - b.year : b.year - a.year) || a.title.localeCompare(b.title);
    });
  }, [params, query]);
  function clear() {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      ["q", "topic", "level", "language", "decade", "free", "sort"].forEach((key) => next.delete(key));
      return next;
    }, { replace: true, preventScrollReset: true });
  }
  return (
    <section id="stacks" className="relative min-h-screen scroll-mt-4 bg-[radial-gradient(ellipse_at_top,#6a441433,transparent_60%),linear-gradient(to_bottom,var(--color-night),var(--color-wood))] px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-center font-heading text-xs tracking-[0.4em] text-gold">THE STACKS</p>
        <h2 className="mt-3 text-center font-display text-3xl text-parchment sm:text-5xl">A world of Bitcoin, bound in books</h2>
        <p className="mt-4 text-center text-lg text-parchment/70 italic">Follow your curiosity. Find your next chapter.</p>
        <div className="mt-10 space-y-5 rounded border border-gold/20 bg-night/60 p-4 sm:p-6">
          <label className="block text-sm text-gold">Search the library
            <input type="search" value={query} onChange={(event) => update("q", event.target.value)} placeholder="Title, subtitle, or author…" className={`${control} mt-2 block w-full text-lg`} />
          </label>
          <fieldset><legend className="mb-2 text-sm text-gold">Topics <span className="text-parchment/60">(match any)</span></legend>
            <div className="flex flex-wrap gap-2">{topics.map((topic) => <button type="button" key={topic} aria-pressed={selectedTopics.includes(topic)} onClick={() => {
              setParams((previous) => {
                const next = new URLSearchParams(previous);
                const active = next.getAll("topic");
                next.delete("topic");
                (active.includes(topic) ? active.filter((item) => item !== topic) : [...active, topic]).forEach((item) => next.append("topic", item));
                return next;
              }, { replace: true, preventScrollReset: true });
            }} className={`rounded-full border px-3 py-1 text-sm capitalize focus-visible:outline-2 focus-visible:outline-gold ${selectedTopics.includes(topic) ? "border-gold bg-gold text-night" : "border-gold/30 text-parchment/80 hover:border-gold"}`}>{topic.replaceAll("-", " ")}</button>)}</div>
          </fieldset>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {([ ["level", "Level", ["beginner", "intermediate", "advanced"]], ["language", "Language", languages], ["decade", "Decade", decades], ["sort", "Sort", ["featured", "newest", "oldest", "title"]] ] as const).map(([key, label, options]) => <label key={key} className="text-sm text-gold">{label}<select value={params.get(key) ?? (key === "sort" ? "featured" : "")} onChange={(event) => update(key, event.target.value)} className={`${control} mt-2 block w-full capitalize`}>
              {key !== "sort" && <option value="">All {label === "Language" ? "languages" : label === "Decade" ? "decades" : "levels"}</option>}
              {options.map((option) => <option key={option} value={option}>{key === "decade" ? `${option}s` : option === "newest" ? "Year: newest" : option === "oldest" ? "Year: oldest" : option === "title" ? "Title A–Z" : option}</option>)}
            </select></label>)}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={params.get("free") === "1"} onChange={(event) => update("free", event.target.checked ? "1" : "")} className="size-4 accent-ember" />Free to read</label>
            <button type="button" onClick={clear} className="text-gold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-gold">Clear filters</button>
          </div>
        </div>
        <div className="mt-8 mb-10 flex flex-wrap items-center justify-between gap-4">
          <p role="status" aria-live="polite" className="text-parchment/70">{results.length} {results.length === 1 ? "book" : "books"} found</p>
          <div className="flex gap-2" role="group" aria-label="Library view">{["stacks", "grid"].map((view) => <button key={view} type="button" aria-pressed={grid === (view === "grid")} onClick={() => update("view", view)} className={`${control} ${grid === (view === "grid") ? "border-gold text-gold" : ""}`}>{view === "stacks" ? "Stacks" : "Cover grid"}</button>)}</div>
        </div>
        {!results.length ? <div className="py-20 text-center"><h3 className="font-heading text-2xl">No books on this shelf yet</h3><p className="mt-3 text-parchment/70">Try another search or loosen your filters.</p><button onClick={clear} className="mt-5 text-gold underline">Clear filters</button></div> : grid ?
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">{results.map((book) => <BookCard key={book.slug} book={book} />)}</div> :
          <><div className="catalog-shelves">{results.map((book) => <StackBook key={book.slug} book={book} />)}</div><p className="mt-8 text-center text-sm text-parchment/60"><span className="text-ember">●</span> Free to read</p></>}
      </div>
    </section>
  );
}
