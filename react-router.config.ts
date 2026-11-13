import type { Config } from "@react-router/dev/config";
import books from "./books.json";

// Static site: every route is prerendered to real HTML at build time (for search engines,
// link previews, and hosts like GitHub Pages that can't send unknown paths to the app).
// BASE_PATH is the folder the site is served from, e.g. "/thetimechainlibrary/" on GitHub Pages.
export default {
  ssr: false,
  basename: process.env.BASE_PATH ?? "/",
  prerender: ["/", ...books.filter((b) => !b.borderline).map((b) => `/books/${b.slug}`)],
} satisfies Config;
