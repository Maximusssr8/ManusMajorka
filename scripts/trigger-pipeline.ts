/**
 * Manual pipeline trigger. Runs the Apify pintostudio pipeline directly
 * (bypassing HTTP) and prints a summary. Usage:
 *
 *   pnpm tsx scripts/trigger-pipeline.ts
 *   # or: pnpm pipeline:trigger
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '..', '.env') });

const REQUIRED = [
  'APIFY_API_TOKEN',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
] as const;

function checkEnv(): string[] {
  const missing: string[] = [];
  for (const key of REQUIRED) {
    if (key === 'APIFY_API_TOKEN') {
      if (!process.env.APIFY_API_TOKEN && !process.env.APIFY_API_KEY) missing.push(key);
      continue;
    }
    if (key === 'SUPABASE_URL') {
      if (!process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL) missing.push(key);
      continue;
    }
    if (!process.env[key]) missing.push(key);
  }
  return missing;
}

async function main(): Promise<void> {
  const missing = checkEnv();
  if (missing.length > 0) {
    process.stderr.write(
      `[trigger-pipeline] Missing env vars: ${missing.join(', ')}\n` +
        `Set them in .env (see .env.example) and re-run \`pnpm pipeline:trigger\`.\n`,
    );
    process.exit(1);
  }

  // Dynamic import so missing env vars fail cleanly above instead of at module load.
  const { runApifyPintostudioPipeline } = await import('../server/lib/apifyPintostudio');

  const t0 = Date.now();
  process.stdout.write('[trigger-pipeline] starting...\n');
  const result = await runApifyPintostudioPipeline();
  const dt = Date.now() - t0;

  process.stdout.write(
    `\n[trigger-pipeline] done in ${(dt / 1000).toFixed(1)}s\n` +
      `  status:           ${result.status}\n` +
      `  products_added:   ${result.productsAdded}\n` +
      `  products_updated: ${result.productsUpdated}\n` +
      `  products_rejected:${result.productsRejected}\n` +
      `  log id:           ${result.logId ?? '(null)'}\n` +
      `  breakdown:        ${JSON.stringify(result.sourceBreakdown)}\n` +
      `  errors (${result.errors.length}): ${result.errors.slice(0, 5).join(' | ')}\n`,
  );

  process.exit(result.status === 'error' ? 1 : 0);
}

main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  process.stderr.write(`[trigger-pipeline] fatal: ${msg}\n`);
  process.exit(1);
});
