import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

// NOTE: vite-plugin-manus-runtime removed to eliminate "Made with Manus" badge

const plugins = [react(), tailwindcss(), jsxLocPlugin()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    // Force a single instance of React — prevents "two copies of React" crash
    // when Claude worktrees share the pnpm store and Vite picks up the wrong copy.
    dedupe: ["react", "react-dom", "react-dom/client"],
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    // Disable modulepreload <link> emission. Vite would otherwise add a
    // preload <link> for every chunk the entry statically imports — including
    // vendor chunks shared via Rollup's auto-split. That eagerly fetches
    // megabytes of diagram/syntax code on first paint, defeating lazy routes.
    // Lazy chunks still fetch on demand when their route renders.
    modulePreload: false,
    rollupOptions: {
      output: {
        // Stop Rollup from hoisting transitive imports up into the entry's
        // static-import list. Without this, a chunk that imports react-vendor
        // would force the browser to eagerly fetch react-vendor — which is
        // fine, but the same mechanism was pulling diagram-vendor (2.2 MB) in
        // just because it happened to host the shared __vite_preload helper.
        hoistTransitiveImports: false,
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;

          // NOTE: We intentionally do NOT group Shiki (@shikijs/*) or
          // Streamdown together, for the same reason as below — Rollup would
          // hoist the preload helper into this massive (~10 MB of grammars)
          // vendor chunk and make the entry statically depend on it, which
          // defeats our lazy-load of Streamdown. Letting Rollup auto-split
          // them yields per-language chunks fetched on demand.

          // NOTE: We intentionally do NOT group mermaid/cytoscape/d3 into a
          // "diagram-vendor" chunk. When we did, Rollup hoisted its shared
          // __vite_preload helper into that chunk, which forced a 2.2 MB
          // static fetch on first paint. Letting Rollup auto-split these
          // libraries keeps them naturally lazy-behind the Streamdown dynamic
          // import in Markdown.tsx.

          // NOTE: We intentionally do NOT group recharts/react-smooth into a
          // "chart-vendor" chunk. Doing so caused Rollup to hoist the shared
          // `_interopDefaultCompat` helper into chart-vendor, while
          // react-vendor itself needs that helper to wrap React's CJS export
          // (`const React = _interop(reactModule)`). Result: a chunk cycle
          // react-vendor → chart-vendor → ui-vendor → react-vendor, which
          // executed ui-vendor before react-vendor's exports were populated
          // and crashed the boot with `undefined.forwardRef`. Letting Rollup
          // auto-split recharts keeps the helper in react-vendor and breaks
          // the cycle — recharts still ends up shared across pages that use it.

          // 3D / Three.js
          if (id.includes("three") || id.includes("@react-three")) {
            return "three-vendor";
          }

          // GSAP animation
          if (id.includes("gsap") || id.includes("@gsap")) {
            return "gsap-vendor";
          }

          // Core React + ALL React-adjacent libs in ONE chunk.
          // Splitting React-dependent code into separate vendor chunks
          // (ui-vendor, motion-vendor, data-vendor) repeatedly caused
          // Rollup to hoist shared interop helpers (`_interopDefaultCompat`,
          // React's CJS unwrap) into one of those chunks. react-vendor then
          // had to import that chunk back, creating a runtime cycle:
          // react-vendor → data-vendor → react-vendor, executing the
          // dependent chunk before React's exports were populated and
          // crashing boot with `undefined.createContext` / `forwardRef`.
          // Bundling them together eliminates the cycle by construction.
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/") ||
            id.includes("react-helmet-async") ||
            id.includes("wouter") ||
            id.includes("@radix-ui") ||
            id.includes("lucide-react") ||
            id.includes("cmdk") ||
            id.includes("class-variance-authority") ||
            id.includes("clsx") ||
            id.includes("tailwind-merge") ||
            id.includes("framer-motion") ||
            id.includes("motion-dom") ||
            id.includes("motion-utils") ||
            id.includes("@tanstack/react-query") ||
            id.includes("@trpc") ||
            id.includes("superjson") ||
            id.includes("zod")
          ) {
            return "react-vendor";
          }

          // Supabase
          if (id.includes("@supabase")) {
            return "supabase-vendor";
          }

          // Sentry
          if (id.includes("@sentry")) {
            return "sentry-vendor";
          }

          // PostHog
          if (id.includes("posthog")) {
            return "posthog-vendor";
          }

          // AI SDK (Anthropic/OpenAI)
          if (id.includes("@ai-sdk") || id.includes("@anthropic-ai")) {
            return "ai-vendor";
          }
        },
      },
    },
  },
  server: {
    headers: {
      "Content-Security-Policy": "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
    },
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      // Deny dotfiles AND everything inside .claude worktrees
      deny: ["**/.*", "**/.claude/**"],
    },
  },
});
