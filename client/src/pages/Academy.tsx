/**
 * Public Academy — mounted at /academy (no authentication required).
 * Progress is stored locally; upgrading signs the visitor into the
 * authenticated /app/learn experience.
 */
import { AcademyPage } from '@/components/academy/AcademyPage';

export default function PublicAcademy() {
  return <AcademyPage publicMode />;
}
