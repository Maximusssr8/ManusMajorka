// Pragmatic error classifier for Supabase/Postgres responses.
// When migrations haven't been applied yet on a fresh environment, we want
// read endpoints to return empty state (200) instead of a hard 500 that
// blanks the UI.

export interface PgLikeError {
  code?: string;
  message?: string;
  details?: string;
}

const MISSING_RELATION = '42P01'; // relation/table does not exist
const UNDEFINED_COLUMN = '42703'; // column does not exist

export function isMissingTable(err: PgLikeError | null | undefined): boolean {
  if (!err) return false;
  if (err.code === MISSING_RELATION) return true;
  const m = (err.message || '').toLowerCase();
  return m.includes('relation') && m.includes('does not exist');
}

export function isMissingColumn(err: PgLikeError | null | undefined): boolean {
  if (!err) return false;
  if (err.code === UNDEFINED_COLUMN) return true;
  const m = (err.message || '').toLowerCase();
  return m.includes('column') && m.includes('does not exist');
}

export function isMissingSchema(err: PgLikeError | null | undefined): boolean {
  return isMissingTable(err) || isMissingColumn(err);
}
