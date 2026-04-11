#!/usr/bin/env node
/**
 * Apply pending Supabase migrations directly via DATABASE_URL.
 * Safe to re-run — every statement uses CREATE IF NOT EXISTS / DROP IF EXISTS.
 *
 * Usage:
 *   node scripts/apply-migrations.mjs <file1.sql> [file2.sql ...]
 *
 * Reads DATABASE_URL from .env.local.
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { config } from 'dotenv';
import pg from 'pg';

config({ path: '.env.local' });
config();

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const connStr = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!connStr) {
  console.error('DATABASE_URL not set in environment');
  process.exit(1);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node scripts/apply-migrations.mjs <file1.sql> [file2.sql ...]');
  process.exit(1);
}

const { Client } = pg;
const client = new Client({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    await client.connect();
    console.log(`connected to ${new URL(connStr).host}`);

    for (const rel of files) {
      const abs = path.isAbsolute(rel) ? rel : path.join(root, rel);
      if (!fs.existsSync(abs)) {
        console.error(`! skip — not found: ${rel}`);
        continue;
      }
      const sql = fs.readFileSync(abs, 'utf8');
      const bytes = Buffer.byteLength(sql, 'utf8');
      console.log(`→ applying ${rel} (${bytes}B)`);
      try {
        await client.query(sql);
        console.log(`✓ ${rel}`);
      } catch (err) {
        console.error(`✗ ${rel}: ${err.message}`);
        if (err.code) console.error(`  code: ${err.code}`);
        process.exitCode = 1;
      }
    }

    // Verify the key tables exist.
    const checks = [
      { name: 'usage_counters', sql: "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='usage_counters'" },
      { name: 'api_keys', sql: "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='api_keys'" },
      { name: 'api_usage', sql: "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='api_usage'" },
    ];
    console.log('\n--- verification ---');
    for (const c of checks) {
      const r = await client.query(c.sql);
      const present = parseInt(r.rows[0].count, 10) === 1;
      console.log(`${present ? '✓' : '✗'} ${c.name}`);
    }
  } finally {
    await client.end();
  }
})();
