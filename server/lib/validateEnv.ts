const REQUIRED_ENV_PAIRS = [
  ['SUPABASE_URL', 'VITE_SUPABASE_URL'],
  ['SUPABASE_SERVICE_ROLE_KEY'],
  ['ANTHROPIC_API_KEY'],
] as const;

const OPTIONAL_ENV_VARS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_BUILDER_PRICE_ID',
  'STRIPE_SCALE_PRICE_ID',
  'APIFY_API_TOKEN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'SENTRY_DSN',
] as const;

export function validateEnv() {
  const missing = REQUIRED_ENV_PAIRS.filter(
    alts => !alts.some(key => process.env[key])
  );
  if (missing.length > 0) {
    console.error('[FATAL] Missing required environment variables:');
    missing.forEach(alts => console.error(`  - ${alts.join(' or ')}`));
    if (process.env.NODE_ENV !== 'production') {
      console.error('Set these in .env.local or your environment');
    }
    process.exit(1);
  }

  const missingOptional = OPTIONAL_ENV_VARS.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn('[WARN] Missing optional environment variables (features may be degraded):');
    missingOptional.forEach(key => console.warn(`  - ${key}`));
  }
}
