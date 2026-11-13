# The Timechain Library

Every book ever written about Bitcoin, gathered in one hall.

**Live site:** https://keraliss.github.io/thetimechainlibrary/

You walk into a candlelit library hall, a 3D scene drawn in WebGL, and down into the stacks.
There you can search and filter 175 Bitcoin books by topic, level, language and decade. Each
book has its own page with a cover, a short summary, and ways to read it: a free copy when the
author offers one, a place to buy it, or a library that lends it.

## What's in the catalogue

- **Bitcoin only.** No altcoin, "blockchain not Bitcoin" or general crypto books.
- **Books from 2013 to today,** in nine languages, from beginner introductions to
  programming books.
- **Free links are always legitimate:** the author's or publisher's own release, a Creative
  Commons edition, or an official repository. We never link to pirate copies.
- **We never host books.** Every link goes out to wherever the book lives.

## Run it locally

Requires Node 22.

```sh
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run build      # static site in build/client
```

## How it's built

- **React Router v7** (framework mode) on **Vite**. It is a static site: every page, including
  one per book, is prerendered to HTML at build time. There is no server.
- **Tailwind CSS** for styling, **Motion** for animation, and **three.js** with
  **react-three-fiber** for the hall. The 3D code loads separately, after the page is up.
- **Fuse.js** for search, all in the browser.

Main folders:

```
app/routes/           home page (hall + stacks) and the book page
app/components/hero/  the hall and the scroll into the stacks
app/components/stacks/  the library browser: search, filters, shelf and grid views
app/components/book/  covers (real or generated) and the flipping cover
app/lib/books.ts      loads books.json; link helpers, including Amazon
books.json            the whole catalogue
public/covers/        cover images (WebP), one per book slug
```

## The data

`books.json` is the entire catalogue. To add or fix a book, edit it there. Main fields:

| Field | Meaning |
|---|---|
| `slug` | URL id (`/books/<slug>`). Keep it stable once published. |
| `title`, `subtitle`, `authors`, `year`, `language` | The basics. |
| `topics` | 1–3 of: economics, history, technical, programming, lightning, philosophy, politics, investing, self-custody, mining, privacy, fiction, children, biography, energy, culture, development, beginner-intro. |
| `level` | `beginner`, `intermediate`, `advanced` or `null`. |
| `gist` | One or two sentences on what the book is about. |
| `free_link`, `free_link_note` | A legitimate free copy, and its licence or source. |
| `info_link` | The book's own page (author, publisher or shop). |
| `amazon_asin` | The book's Amazon product ID: the 10 characters after `/dp/` in its Amazon URL. |
| `isbn` | ISBN-13, used for library and bookseller lookups. |
| `cover` | Path of the cover image, e.g. `/covers/<slug>.webp`. Without one, a cover is generated from the title. |
| `borderline` | `true` hides the book until it's decided whether it belongs. |

## Deployment

Every push to `main` builds the site and publishes it to GitHub Pages
(`.github/workflows/deploy.yml`). The repository's Pages source is set to **GitHub Actions**.

The site is served from a folder (`/thetimechainlibrary/`), which the build gets from the
`BASE_PATH` environment variable. To host it at a domain root instead (a custom domain, or
another static host such as Cloudflare Pages), build with `BASE_PATH` unset.

## Suggest a book

Missing a book, or found a wrong link? Open an issue with the title, author and a link, or send
a pull request that edits `books.json`.

## Affiliate disclosure

Some "Buy on Amazon" links are Amazon affiliate links. As an Amazon Associate, we earn from
qualifying purchases. It costs you nothing extra, and it helps keep the library running.
