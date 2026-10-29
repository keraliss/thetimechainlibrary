import type { Config } from "@react-router/dev/config";

// SPA for now; turn on `prerender` before launch so every route ships real HTML.
export default {
  ssr: false,
} satisfies Config;
