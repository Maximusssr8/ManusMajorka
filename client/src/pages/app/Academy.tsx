/**
 * Authenticated Academy — mounted at /app/learn inside the app shell.
 * Shares the same visual + content component as the public /academy route,
 * but syncs lesson progress to /api/academy/progress.
 */
import { AcademyPage } from '@/components/academy/AcademyPage';

export default function Academy() {
  return <AcademyPage publicMode={false} />;
}
