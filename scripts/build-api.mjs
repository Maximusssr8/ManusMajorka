import { build } from "esbuild";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

await build({
  entryPoints: [resolve(root, "api/index.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: resolve(root, "api/index.serverless.js"),
  logLevel: "warning",
  // Provide require() shim so bundled CJS packages work in ESM context
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
});

console.log("API bundle built successfully.");
