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
  optimizeDeps: {
    include: ['recharts', 'recharts-scale'],
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor-react';
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/lucide-react')) return 'vendor-ui';
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
          if (id.includes('node_modules/@tanstack') || id.includes('node_modules/@trpc')) return 'vendor-query';
          // recharts + d3 NOT chunked separately — circular deps cause TDZ crash
          if (id.includes('node_modules/mermaid') || id.includes('node_modules/@streamdown/mermaid') || id.includes('node_modules/cytoscape')) return 'vendor-mermaid';
          if (id.includes('node_modules/streamdown') || id.includes('node_modules/@streamdown')) return 'vendor-markdown';
          if (id.includes('node_modules/stripe') || id.includes('node_modules/@stripe')) return 'vendor-stripe';
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
