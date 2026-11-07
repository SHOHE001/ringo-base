import { yesterdayKey } from './date';

export type StreakState = {
  streakCount: number;
  lastStudyDate: string | null;
};

/**
 * 学習した日を基準に連続日数を更新する。
 * 同日は維持、前日なら +1、それ以外は 1 に戻す。
 */
export function updateStreak(state: StreakState, today: string): StreakState {
  if (!state.lastStudyDate) {
    return { streakCount: 1, lastStudyDate: today };
  }
  if (state.lastStudyDate === today) {
    return state;
  }
  if (state.lastStudyDate === yesterdayKey(today)) {
    return {
      streakCount: Math.max(1, state.streakCount) + 1,
      lastStudyDate: today,
    };
  }
  return { streakCount: 1, lastStudyDate: today };
}

/**
 * 表示用の連続日数。最後の学習日が一昨日以前なら 0。
 */
export function displayStreak(
  streakCount: number,
  lastStudyDate: string | null,
  today: string,
): number {
  if (!lastStudyDate) return 0;
  if (lastStudyDate === today || lastStudyDate === yesterdayKey(today)) {
    return Math.max(0, streakCount);
  }
  return 0;
}
