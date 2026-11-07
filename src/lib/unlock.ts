import type { LessonStatus, LoadedLesson, LoadedUnit } from './types';

/**
 * レッスンを順に並べ、最初の未完了を current、それ以降を locked にする。
 * 完了済みの ID は常に completed として扱う（後からレッスンを足しても壊れない）。
 */
export function getLessonStatuses(
  lessonIds: readonly string[],
  completedIds: Iterable<string>,
): Record<string, LessonStatus> {
  const completed = new Set(completedIds);
  const firstIncomplete = lessonIds.findIndex((id) => !completed.has(id));
  const statuses: Record<string, LessonStatus> = {};
  lessonIds.forEach((id, index) => {
    if (completed.has(id)) {
      statuses[id] = 'completed';
    } else if (index === firstIncomplete) {
      statuses[id] = 'current';
    } else {
      statuses[id] = 'locked';
    }
  });
  return statuses;
}

export function flattenLessons(units: readonly LoadedUnit[]): LoadedLesson[] {
  return units.flatMap((unit) => unit.lessons);
}

export function completedLessonCount(
  units: readonly LoadedUnit[],
  completedIds: Iterable<string>,
): number {
  const completed = new Set(completedIds);
  return flattenLessons(units).filter((lesson) => completed.has(lesson.id)).length;
}
