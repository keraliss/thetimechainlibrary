import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [index("routes/home.tsx"), route("books/:slug", "routes/book.tsx")] satisfies RouteConfig;
