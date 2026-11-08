import { storageKey } from '../config';
import { parseDateKey } from './date';
import type { Progress } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function parseStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((item) => typeof item === 'string' && item.trim().length > 0)) {
    return null;
  }
  return [...new Set(value)];
}

export function createInitialProgress(): Progress {
  return {
    version: 1,
    xp: 0,
    completedLessonIds: [],
    reviewQuestionIds: [],
    streakCount: 0,
    lastStudyDate: null,
    dailyXp: {},
  };
}

function parseStoredProgress(raw: unknown): Progress | null {
  if (!isRecord(raw)) return null;
  if (raw.version !== 1) return null;
  if (!isNonNegativeNumber(raw.xp)) return null;

  const completedLessonIds = parseStringArray(raw.completedLessonIds);
  if (!completedLessonIds) return null;
  const reviewQuestionIds = parseStringArray(raw.reviewQuestionIds);
  if (!reviewQuestionIds) return null;

  if (
    typeof raw.streakCount !== 'number' ||
    !Number.isInteger(raw.streakCount) ||
    raw.streakCount < 0
  ) {
    return null;
  }

  let lastStudyDate: string | null;
  if (raw.lastStudyDate === null) {
    lastStudyDate = null;
  } else if (
    typeof raw.lastStudyDate === 'string' &&
    parseDateKey(raw.lastStudyDate) !== null
  ) {
    lastStudyDate = raw.lastStudyDate;
  } else {
    return null;
  }

  const dailyXp: Record<string, number> = {};
  if (raw.dailyXp !== undefined) {
    if (!isRecord(raw.dailyXp)) return null;
    for (const [key, value] of Object.entries(raw.dailyXp)) {
      if (parseDateKey(key) === null || !isNonNegativeNumber(value)) continue;
      dailyXp[key] = value;
    }
  }

  return {
    version: 1,
    xp: Math.trunc(raw.xp),
    completedLessonIds,
    reviewQuestionIds,
    streakCount: raw.streakCount,
    lastStudyDate,
    dailyXp,
  };
}

/** localStorage を読む。存在しない・壊れている場合は初期状態を返す。 */
export function loadProgress(): Progress {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return createInitialProgress();
    const parsed: unknown = JSON.parse(stored);
    return parseStoredProgress(parsed) ?? createInitialProgress();
  } catch {
    return createInitialProgress();
  }
}

export function saveProgress(progress: Progress): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(progress));
  } catch {
    // 保存できない環境でもアプリの動作は続ける。
  }
}

export function clearProgress(): void {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // 何もしない。
  }
}
