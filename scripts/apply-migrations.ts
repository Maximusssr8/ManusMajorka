/**
 * Majorka — Supabase migration runner
 *
 * Usage:  pnpm db:migrate
 *
 * Reads SQL files in a deterministic order, executes them against the
 * Supabase Postgres database pointed to by $DATABASE_URL (or
 * $SUPABASE_DB_URL as a fallback), and records each one in the
 * `schema_migrations` table so repeated runs are a no-op.
 *
 * Every migration SQL file in this directory is authored to be
 * idempotent (`IF NOT EXISTS`, `COALESCE(...)` backfills, etc.), so the
 * script is safe to re-run even against partially-migrated databases.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import pg from "pg";

const { Client } = pg;

// Load .env so the script works outside of the Vite/Vercel runtime.
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
loadEnv({ path: resolve(projectRoot, ".env") });

// Deterministic order. Each entry maps a logical migration name (stored
// in schema_migrations) to the SQL file it lives in.
const MIGRATIONS: ReadonlyArray<{ name: string; file: string }> = [
  { name: "velocity", file: "velocity-migration.sql" },
  { name: "apify-ae-fields", file: "apify-ae-fields-migration.sql" },
  { name: "alerts", file: "alerts-migration.sql" },
  { name: "ships-to-au", file: "ships-to-au-migration.sql" },
];

function getConnectionString(): string {
  const url =
    process.env.SUPABASE_DB_URL ||
    process.env.DATABASE_URL ||
    "";

  if (!url) {
    console.error(
      "\n[apply-migrations] Missing database connection string.\n" +
        "  Set one of the following in .env and re-run `pnpm db:migrate`:\n" +
        "    DATABASE_URL=postgresql://postgres:<pw>@db.<project>.supabase.co:5432/postgres\n" +
        "    SUPABASE_DB_URL=postgresql://... (alias, takes precedence)\n" +
        "  For the Supabase pooled connection (recommended for scripts):\n" +
        "    postgresql://postgres.<project>:<service-role-pw>@aws-0-<region>.pooler.supabase.com:6543/postgres\n",
    );
    process.exit(1);
  }
  return url;
}

async function ensureMigrationsTable(client: InstanceType<typeof Client>): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function alreadyApplied(
  client: InstanceType<typeof Client>,
  name: string,
): Promise<boolean> {
  const res = await client.query(
    "SELECT 1 FROM schema_migrations WHERE name = $1 LIMIT 1",
    [name],
  );
  return res.rowCount !== null && res.rowCount > 0;
}

async function applyMigration(
  client: InstanceType<typeof Client>,
  name: string,
  file: string,
): Promise<"applied" | "skipped"> {
  if (await alreadyApplied(client, name)) {
    console.log(`  [skip]   ${name} (already recorded)`);
    return "skipped";
  }

  const sqlPath = resolve(__dirname, file);
  const sql = readFileSync(sqlPath, "utf8");

  console.log(`  [apply]  ${name} (${file})`);

  // Run the whole file in a single transaction so partial failure rolls
  // back cleanly. Each file uses `IF NOT EXISTS` idempotency guards, so
  // re-runs after a crashed mid-apply are still safe.
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(
      "INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
      [name],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }

  return "applied";
}

async function main(): Promise<void> {
  const connectionString = getConnectionString();

  // Supabase requires SSL for direct and pooled connections alike. We
  // don't pin the CA because the connection string already identifies
  // the correct host and we're only sending DDL, not user data.
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log("[apply-migrations] Connecting to database...");
  await client.connect();

  try {
    await ensureMigrationsTable(client);

    console.log(
      `[apply-migrations] Running ${MIGRATIONS.length} migrations in order:`,
    );

    let applied = 0;
    let skipped = 0;
    for (const migration of MIGRATIONS) {
      const result = await applyMigration(client, migration.name, migration.file);
      if (result === "applied") applied += 1;
      else skipped += 1;
    }

    console.log(
      `\n[apply-migrations] Done. applied=${applied} skipped=${skipped} total=${MIGRATIONS.length}`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\n[apply-migrations] FAILED:", err);
  process.exit(1);
});
