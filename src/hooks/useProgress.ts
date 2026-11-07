import { useCallback, useEffect, useState } from 'react';
import { toDateKey } from '../lib/date';
import {
  clearProgress,
  createInitialProgress,
  loadProgress,
  saveProgress,
} from '../lib/storage';
import { updateStreak } from '../lib/streak';
import type { Progress } from '../lib/types';

export type ProgressActions = {
  awardXp: (amount: number, date?: string) => void;
  completeLesson: (lessonId: string) => void;
  addReviewQuestions: (questionIds: readonly string[]) => void;
  removeReviewQuestion: (questionId: string) => void;
  resetProgress: () => void;
};

export function useProgress(): { progress: Progress; actions: ProgressActions } {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);


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
      resetProgress,
    },
  };
}
