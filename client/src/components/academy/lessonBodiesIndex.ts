/**
 * Unified lesson body lookup.
 * Combines Modules 1-4 (lessonBodies.ts) with Modules 5-8 (lessonBodiesPart2.ts).
 */
import { LESSON_BODIES } from './lessonBodies';
import { LESSON_BODIES_PART2 } from './lessonBodiesPart2';

const ALL_BODIES: Record<string, string> = { ...LESSON_BODIES, ...LESSON_BODIES_PART2 };

export function getLessonBody(lessonId: string): string | undefined {
  return ALL_BODIES[lessonId];
}

export function hasLessonBody(lessonId: string): boolean {
  return lessonId in ALL_BODIES;
}
