import { lastNDateKeys } from './date';
import type { LoadedQuestion, LoadedUnit } from './types';

export type DayXp = { date: string; xp: number };

/** 今日を含む直近 days 日の XP を古い順に返す。記録のない日は 0。 */
export function recentDailyXp(
  dailyXp: Readonly<Record<string, number>>,
  today: string,
  days = 7,
): DayXp[] {
  return lastNDateKeys(today, days).map((date) => ({
    date,
    xp: dailyXp[date] ?? 0,
  }));
}

export type UnitProgress = {
  unitId: string;
  title: string;
  done: number;
  total: number;
};

export function unitProgressList(
  units: readonly LoadedUnit[],
  completedIds: Iterable<string>,
): UnitProgress[] {
  const completed = new Set(completedIds);
  return units.map((unit) => ({
    unitId: unit.id,
    title: unit.title,
    done: unit.lessons.filter((lesson) => completed.has(lesson.id)).length,
    total: unit.lessons.length,
  }));
}

/**
 * 復習セッションの問題を選ぶ。保存順（古い順）に最大 limit 問。
 * コンテンツから消えた ID と match は除く。
 */
export function pickReviewQuestions(
  units: readonly LoadedUnit[],
  reviewIds: readonly string[],
  limit: number,
): LoadedQuestion[] {
  const byId = new Map<string, LoadedQuestion>();
  for (const unit of units) {
    for (const lesson of unit.lessons) {
      for (const question of lesson.questions) byId.set(question.id, question);
    }
  }
  const picked: LoadedQuestion[] = [];
  for (const id of reviewIds) {
    if (picked.length >= limit) break;
    const question = byId.get(id);
    if (question && question.data.type !== 'match') picked.push(question);
  }
  return picked;
}

/** 復習リストのうち、いま出題できる問題の数。 */
export function countReviewable(
  units: readonly LoadedUnit[],
  reviewIds: readonly string[],
): number {
  return pickReviewQuestions(units, reviewIds, Number.POSITIVE_INFINITY).length;
}
