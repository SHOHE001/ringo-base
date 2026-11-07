import { useCallback, useEffect, useState } from 'react';
import { toDateKey } from '../lib/date';
import {
  refillHearts as refillHeartsState,
  regenerateHearts,
  spendHeart as spendHeartState,
} from '../lib/hearts';
import {
  clearProgress,
  createInitialProgress,
  loadProgress,
  saveProgress,
} from '../lib/storage';
import { updateStreak } from '../lib/streak';
import type { Progress } from '../lib/types';

const HEART_SYNC_INTERVAL_MS = 30_000;

export type ProgressActions = {
  awardXp: (amount: number, date?: string) => void;
  completeLesson: (lessonId: string) => void;
  addReviewQuestions: (questionIds: readonly string[]) => void;
  removeReviewQuestion: (questionId: string) => void;
  spendHeart: () => void;
  refillHearts: () => void;
  resetProgress: () => void;
};

export function useProgress(): { progress: Progress; actions: ProgressActions } {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    const syncHearts = () => {
      setProgress((current) => {
        const healed = regenerateHearts(
          { hearts: current.hearts, heartAnchor: current.heartAnchor },
          Date.now(),
        );
        if (
          healed.hearts === current.hearts &&
          healed.heartAnchor === current.heartAnchor
        ) {
          return current;
        }
        return {
          ...current,
          hearts: healed.hearts,
          heartAnchor: healed.heartAnchor,
        };
      });
    };

    syncHearts();
    const timer = window.setInterval(syncHearts, HEART_SYNC_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncHearts();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const awardXp = useCallback((amount: number, date?: string) => {
    if (!Number.isFinite(amount) || amount === 0) return;
    const gained = Math.max(0, Math.trunc(amount));
    if (gained === 0) return;

    setProgress((current) => {
      const today = date ?? toDateKey(new Date());
      const streak = updateStreak(
        {
          streakCount: current.streakCount,
          lastStudyDate: current.lastStudyDate,
        },
        today,
      );
      return {
        ...current,
        xp: current.xp + gained,
        dailyXp: {
          ...current.dailyXp,
          [today]: (current.dailyXp[today] ?? 0) + gained,
        },
        streakCount: streak.streakCount,
        lastStudyDate: streak.lastStudyDate,
      };
    });
  }, []);

  const completeLesson = useCallback((lessonId: string) => {
    setProgress((current) => {
      if (current.completedLessonIds.includes(lessonId)) return current;
      return {
        ...current,
        completedLessonIds: [...current.completedLessonIds, lessonId],
      };
    });
  }, []);

  const addReviewQuestions = useCallback((questionIds: readonly string[]) => {
    if (questionIds.length === 0) return;
    setProgress((current) => {
      const next = new Set(current.reviewQuestionIds);
      for (const id of questionIds) next.add(id);
      return {
        ...current,
        reviewQuestionIds: [...next],
      };
    });
  }, []);

  const removeReviewQuestion = useCallback((questionId: string) => {
    setProgress((current) => {
      if (!current.reviewQuestionIds.includes(questionId)) return current;
      return {
        ...current,
        reviewQuestionIds: current.reviewQuestionIds.filter(
          (id) => id !== questionId,
        ),
      };
    });
  }, []);

  const spendHeart = useCallback(() => {
    setProgress((current) => {
      const spent = spendHeartState(
        { hearts: current.hearts, heartAnchor: current.heartAnchor },
        Date.now(),
      );
      return {
        ...current,
        hearts: spent.hearts,
        heartAnchor: spent.heartAnchor,
      };
    });
  }, []);

  const refillHearts = useCallback(() => {
    const filled = refillHeartsState(Date.now());
    setProgress((current) => ({
      ...current,
      hearts: filled.hearts,
      heartAnchor: filled.heartAnchor,
    }));
  }, []);

  const resetProgress = useCallback(() => {
    clearProgress();
    setProgress(createInitialProgress());
  }, []);

  return {
    progress,
    actions: {
      awardXp,
      completeLesson,
      addReviewQuestions,
      removeReviewQuestion,
      spendHeart,
      refillHearts,
      resetProgress,
    },
  };
}
