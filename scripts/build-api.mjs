import { build } from "esbuild";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

await build({
  entryPoints: [resolve(root, "api/_server.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: resolve(root, "api/index.serverless.js"),
  logLevel: "warning",
});

console.log("API bundle built successfully.");
